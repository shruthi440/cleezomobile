import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorContext } from '../ErrorContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ParentFees'>;
type FeesViewProps = Props & { embedded?: boolean };

type FeeRow = {
  key: string;
  label: string;
  amount: number;
  paid: number;
  discount: number;
  due: number;
  paymentDate?: string;
};

type DynamicFeeType = {
  id?: number | string;
  feeName?: string;
  feesType?: string;
  scope?: string;
  frequency?: string;
  installments?: number;
  columnBase?: string;
};

const logoImage: ImageSourcePropType = require('../assets/Cleezo.png');

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const toNumber = (value: any) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeFeeKey = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const formatFeeLabel = (key: string) =>
  String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bFees\b/g, 'Fee')
    .trim();

const buildFeeKeyVariants = (value: string) => {
  const normalized = normalizeFeeKey(value);
  const variants = new Set<string>();
  if (!normalized) return [];

  variants.add(normalized);
  variants.add(normalized.replace(/_fee(s)?$/, ''));
  variants.add(normalized.replace(/_amount$/, ''));

  if (normalized.endsWith('s')) {
    variants.add(normalized.slice(0, -1));
  } else {
    variants.add(`${normalized}s`);
  }

  if (normalized.endsWith('ies')) {
    variants.add(normalized.replace(/ies$/, 'y'));
  }

  return Array.from(variants).filter(Boolean);
};

const mergeFeeData = (classFeeData: Record<string, any> | null, studentFeeData: Record<string, any> | null) => {
  const merged: Record<string, any> = { ...(classFeeData || {}) };

  Object.entries(studentFeeData || {}).forEach(([key, studentValue]) => {
    if (studentValue === null || studentValue === undefined || studentValue === '') return;

    const classValue = merged[key];
    const studentLooksNumeric =
      typeof studentValue === 'number' ||
      (typeof studentValue === 'string' && studentValue.trim() !== '' && !Number.isNaN(Number(studentValue)));

    if (studentLooksNumeric) {
      const studentAmount = toNumber(studentValue);
      const classAmount = toNumber(classValue);
      if (studentAmount === 0 && classAmount > 0) return;
    }

    merged[key] = studentValue;
  });

  return merged;
};

const buildRowsFromSource = (
  paymentSource: Record<string, any> | null,
  amountSource: Record<string, any> | null,
  dynamicFeeTypes: DynamicFeeType[] = []
): FeeRow[] => {
  if (!paymentSource && !amountSource) return [];

  const paymentEntries = Object.entries(paymentSource || {}).map(([key, value]) => [normalizeFeeKey(key), value] as const);
  const amountEntries = Object.entries(amountSource || {}).map(([key, value]) => [normalizeFeeKey(key), value] as const);
  const paymentLookup = new Map<string, any>(paymentEntries);
  const amountLookup = new Map<string, any>(amountEntries);

  const findFirstValue = (keys: string[]) => {
    for (const key of keys) {
      const sourceLookup = keys.some((k) => /paid|discount|due/i.test(k)) ? paymentLookup : amountLookup;
      const variants = buildFeeKeyVariants(key);

      for (const variant of variants) {
        if (!sourceLookup.has(variant)) continue;
        const numeric = toNumber(sourceLookup.get(variant));
        if (numeric || sourceLookup.get(variant) === 0) return numeric;
      }

      for (const [candidateKey, candidateValue] of sourceLookup.entries()) {
        const candidate = normalizeFeeKey(candidateKey);
        if (!candidate) continue;
        if (
          variants.some(
            (variant) =>
              candidate === variant ||
              candidate.includes(variant) ||
              variant.includes(candidate)
          )
        ) {
          const numeric = toNumber(candidateValue);
          if (numeric || candidateValue === 0) return numeric;
        }
      }
    }
    return 0;
  };

  const findBestAmountValue = (keys: string[]) => {
    const matches: number[] = [];

    for (const key of keys) {
      const variants = buildFeeKeyVariants(key);

      for (const variant of variants) {
        if (amountLookup.has(variant)) {
          const numeric = toNumber(amountLookup.get(variant));
          if (numeric || amountLookup.get(variant) === 0) matches.push(numeric);
        }
      }

      for (const [candidateKey, candidateValue] of amountLookup.entries()) {
        const candidate = normalizeFeeKey(candidateKey);
        if (!candidate) continue;
        if (
          variants.some(
            (variant) =>
              candidate === variant ||
              candidate.includes(variant) ||
              variant.includes(candidate)
          )
        ) {
          const numeric = toNumber(candidateValue);
          if (numeric || candidateValue === 0) matches.push(numeric);
        }
      }
    }

    if (!matches.length) return 0;
    return Math.max(...matches);
  };

  const rows: FeeRow[] = [];
  const seen = new Set<string>();

  const addRow = (label: string, amount: number, paid: number, discount: number) => {
    const due = Math.max(amount - paid - discount, 0);
    const key = normalizeFeeKey(label);
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      key: label,
      label,
      amount,
      paid,
      discount,
      due,
      paymentDate: '-',
    });
  };

  const dynamicTypesByBase = new Map<string, DynamicFeeType>();
  dynamicFeeTypes.forEach((item) => {
    const label = String(item?.feeName || item?.feesType || '').trim();
    const base = normalizeFeeKey(item?.columnBase || label);
    if (base) dynamicTypesByBase.set(base, item);
  });

  dynamicTypesByBase.forEach((item, base) => {
    const label = String(item?.feeName || item?.feesType || base).trim();
    const amount = findBestAmountValue([base, `${base}_fee`, `${base}_fees`, `${base}_amount`, label]);
    const paid = findFirstValue([`${base}_paid`, `${base}Paid`, `${label}_paid`, `${label}Paid`]);
    const discount = findFirstValue([`${base}_discount`, `${base}Discount`, `${label}_discount`, `${label}Discount`]);
    const due = findFirstValue([`${base}_due`, `${base}Due`, `${label}_due`, `${label}Due`]);
    const finalLabel = formatFeeLabel(label || base);
    addRow(finalLabel, amount, paid, discount);
    if (due > 0 && seen.has(normalizeFeeKey(finalLabel))) {
      const existing = rows.find((row) => normalizeFeeKey(row.label) === normalizeFeeKey(finalLabel));
      if (existing) existing.due = due;
    }
  });

  return rows;
};

const ParentFees: React.FC<FeesViewProps> = ({ navigation, embedded = false }) => {
  const [studentData, setStudentData] = useState<Record<string, any> | null>(null);
  const [classFeeSource, setClassFeeSource] = useState<Record<string, any> | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any> | null>(null);
  const [dynamicFeeTypes, setDynamicFeeTypes] = useState<DynamicFeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = React.useContext(ErrorContext);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const keys = ['studentId', 'username', 'name', 'class_name', 'section', 'schoolCode'];
        const stores = await AsyncStorage.multiGet(keys);
        const data: Record<string, any> = {};
        stores.forEach(([key, value]) => {
          if (value) data[key] = value;
        });
        setStudentData(data);
      } catch {
        showError('Data Error', 'Failed to load student information.');
      }
    };

    fetchStudentData();
  }, [showError]);

  useEffect(() => {
    let active = true;

    const fetchDynamicFeeTypes = async () => {
      try {
        if (!studentData?.schoolCode) return;

        const res = await axios.get('https://cleezoclass.com:4000/api/fee-types', {
          params: { schoolCode: studentData.schoolCode, _t: Date.now() },
        });

        if (!active) return;

        const rows = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        setDynamicFeeTypes(
          rows
            .filter((item: Record<string, any>) => String(item?.feeName || item?.feesType || '').trim() !== '')
            .map((item: Record<string, any>) => ({
              id: item?.id,
              feeName: item?.feeName || '',
              feesType: item?.feesType || 'Custom Fee',
              scope: item?.scope || 'All',
              frequency: item?.frequency || 'One time',
              installments: item?.installments || 1,
              columnBase: normalizeFeeKey(item?.columnBase || item?.feeName || item?.feesType || ''),
            }))
        );
      } catch {
        if (active) setDynamicFeeTypes([]);
      }
    };

    fetchDynamicFeeTypes();
    return () => {
      active = false;
    };
  }, [studentData?.schoolCode]);

  useEffect(() => {
    let active = true;

    const fetchFees = async () => {
      try {
        if (!studentData?.class_name || !studentData?.section || !studentData?.schoolCode) return;

        const [studentFeeRes, classRes, studentRes, paymentRes, dynamicRowsRes, feeStructureRes] = await Promise.allSettled([
          axios.get(`https://cleezoclass.com:4000/api/fees/${encodeURIComponent(String(studentData.username || ''))}`, {
            params: { schoolCode: studentData.schoolCode },
          }),
          axios.get('https://cleezoclass.com:4000/api/feeDetailsByClassSection', {
            params: {
              className: studentData.class_name,
              section: studentData.section,
              schoolCode: studentData.schoolCode,
            },
          }),
          axios.post('https://cleezoclass.com:4000/api/studentFees', {
            studentId: studentData.studentId,
            schoolCode: studentData.schoolCode,
          }),
          axios.get(`https://cleezoclass.com:4000/api/payment/${studentData.studentId}?schoolCode=${studentData.schoolCode}`),
          axios.get('https://cleezoclass.com:4000/api/student-transactions-dynamic', {
            params: {
              schoolCode: studentData.schoolCode,
              studentName: studentData.name || studentData.username || '',
              className: studentData.class_name,
              section: studentData.section,
              includeUnpaid: 1,
            },
          }),
          axios.get(`https://cleezoclass.com:4000/feeStructure/${encodeURIComponent(String(studentData.class_name || ''))}`, {
            params: {
              schoolCode: studentData.schoolCode,
              section: studentData.section,
            },
          }),
        ]);

        if (!active) return;

        const studentFeePayload = studentFeeRes.status === 'fulfilled' ? studentFeeRes.value.data?.data || {} : {};
        const classFeeData = classRes.status === 'fulfilled' ? classRes.value.data?.feeDetail || {} : {};
        const studentFeeData = studentRes.status === 'fulfilled' ? studentRes.value.data?.feeDetails || {} : {};
        const paymentPayload = paymentRes.status === 'fulfilled' ? paymentRes.value.data?.payments || {} : {};
        const feeStructureData =
          feeStructureRes.status === 'fulfilled'
            ? feeStructureRes.value.data?.feeStructure || feeStructureRes.value.data?.feeDetail || {}
            : {};
        const fallbackClassFeeData =
          classRes.status === 'fulfilled'
            ? classRes.value.data?.feeDetail || classRes.value.data?.feeStructure || {}
            : {};
        const apiRows = dynamicRowsRes.status === 'fulfilled' && Array.isArray(dynamicRowsRes.value.data)
          ? dynamicRowsRes.value.data
          : [];

        console.log('[ParentFees] studentFeePayload keys:', Object.keys(studentFeePayload || {}));
        console.log('[ParentFees] classFeeData keys:', Object.keys(classFeeData || {}));
        console.log('[ParentFees] studentFeeData keys:', Object.keys(studentFeeData || {}));
        console.log('[ParentFees] paymentPayload keys:', Object.keys(paymentPayload || {}));
        console.log('[ParentFees] dynamicRowsRes status:', dynamicRowsRes.status);
        console.log('[ParentFees] dynamicRows count:', apiRows.length);
        console.log('[ParentFees] dynamicRows sample:', apiRows.slice(0, 5).map((row) => ({
          id: row?.id,
          studentName: row?.StudentName || row?.studentName || row?.name,
          className: row?.Class_name || row?.class_name || row?.className,
          section: row?.Section || row?.section || row?.sectionName,
          feeType: row?.fee_type || row?.feeType || row?.FeeType || row?.feeName,
          totalAmount: row?.CompleteFee || row?.completeFee || row?.Final_Amount || row?.Total_Amount || row?.totalAmount,
          paidAmount: row?.Paid_Amount || row?.paid_amount || row?.paidAmount,
          dueAmount: row?.Due_Amount || row?.Total_Due || row?.dueAmount,
        })));

        const routeFeeData = {
          ...(studentFeePayload || {}),
          ...(studentFeePayload?.studentFeeDetails || {}),
        };

        const mergedFeeData = {
          ...mergeFeeData(classFeeData, studentFeeData),
          ...routeFeeData,
          ...(paymentPayload || {}),
          ...(paymentPayload?.discounts || {}),
        };

        setClassFeeSource(Object.keys(feeStructureData || {}).length ? feeStructureData : fallbackClassFeeData || null);
        setPaymentDetails(paymentPayload || null);
        console.log('[ParentFees] feeStructureData keys:', Object.keys(feeStructureData || {}));
        console.log('[ParentFees] fallbackClassFeeData keys:', Object.keys(fallbackClassFeeData || {}));
        console.log('[ParentFees] mergedFeeData keys:', Object.keys(mergedFeeData || {}));
      } catch {
        if (active) {
          showError('Fee Load Error', 'Unable to load fee details.');
          setClassFeeSource(null);
          setPaymentDetails(null);
        }
      }
    };

    const run = async () => {
      setLoading(true);
      await fetchFees();
      if (active) setLoading(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [studentData?.class_name, studentData?.section, studentData?.schoolCode, studentData?.studentId, studentData?.username, showError]);

  const paymentSource = useMemo(
    () => {
      const flattened: Record<string, any> = {
        ...(paymentDetails || {}),
        ...(paymentDetails?.discounts || {}),
      };

      Object.entries(paymentDetails?.dynamicFeeTotals || {}).forEach(([key, value]) => {
        const normalized = normalizeFeeKey(key);
        if (!normalized) return;
        flattened[normalized] = value;
      });

      (Array.isArray(paymentDetails?.feeBreakdown) ? paymentDetails.feeBreakdown : []).forEach((row: any) => {
        const label = String(row?.label || row?.key || '').trim();
        const normalized = normalizeFeeKey(label);
        if (!normalized) return;

        flattened[normalized] = row?.total ?? row?.amount ?? flattened[normalized];
        flattened[`${normalized}_paid`] = row?.paid ?? flattened[`${normalized}_paid`];
        flattened[`${normalized}_discount`] = row?.discount ?? flattened[`${normalized}_discount`];
        flattened[`${normalized}_due`] = row?.due ?? flattened[`${normalized}_due`];
      });

      return flattened;
    },
    [paymentDetails]
  );

  const feeRows = useMemo(() => {
    const dynamicRows = buildRowsFromSource(paymentSource, classFeeSource, dynamicFeeTypes);
    const allowedLabels = new Set(
      dynamicFeeTypes
        .map((item) => normalizeFeeKey(item?.columnBase || item?.feeName || item?.feesType || ''))
        .filter(Boolean)
    );
    const finalRows = dynamicRows.filter((row) => allowedLabels.size === 0 || allowedLabels.has(normalizeFeeKey(row.label)));

    console.log('[ParentFees] dynamicRows count:', dynamicRows.length);
    console.log('[ParentFees] final feeRows count:', finalRows.length);
    console.log('[ParentFees] final feeRows labels:', finalRows.map((row) => row.label));
    console.log('[ParentFees] paymentSource keys:', Object.keys(paymentSource || {}));
    console.log('[ParentFees] classFeeSource keys:', Object.keys(classFeeSource || {}));
    console.log('[ParentFees] feeSource resolved amounts:', {
      dynamicTypeCount: dynamicFeeTypes.length,
    });

    return finalRows;
  }, [classFeeSource, dynamicFeeTypes, paymentSource]);

  const summaryTotalFee = useMemo(() => {
    return feeRows.reduce((sum, row) => sum + row.amount, 0);
  }, [feeRows]);

  const summaryPaid = useMemo(() => {
    return feeRows.reduce((sum, row) => sum + row.paid, 0);
  }, [feeRows]);

  const summaryDiscount = useMemo(() => {
    return feeRows.reduce((sum, row) => sum + row.discount, 0);
  }, [feeRows]);

  const summaryDue = useMemo(() => {
    return Math.max(summaryTotalFee - summaryPaid - summaryDiscount, 0);
  }, [summaryDiscount, summaryPaid, summaryTotalFee]);

  const studentProfile = useMemo(
    () => ({
      studentName: paymentDetails?.studentName || studentData?.name || '-',
      fatherName: paymentDetails?.father_name || studentData?.father_name || studentData?.fatherName || '-',
      mobile: paymentDetails?.phone_no || studentData?.phone_no || studentData?.mobile || studentData?.phoneNumber || '-',
      admissionNo: paymentDetails?.admission_no || studentData?.admission_no || studentData?.admissionNo || '-',
      gender: paymentDetails?.gender || studentData?.gender || '-',
      email: paymentDetails?.email || studentData?.email || '-',
    }),
    [paymentDetails, studentData]
  );

  if (loading || !studentData) {
    return (
      <View style={embedded ? styles.embeddedShell : styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Loading fee data...</Text>
        </View>
      </View>
    );
  }  

  const content = (
    <View style={embedded ? styles.embeddedContent : styles.content}>
      <StatusBar barStyle="dark-content" />

      {!embedded ? (
        <View style={styles.headerRow}>
          <View style={styles.headerBrand}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.title}>Fees</Text>
            <Text style={styles.subtitle}>
              {studentProfile.studentName} {studentData?.class_name || ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.studentDataWrap}>
      

        <View style={styles.transactionWrap}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardLeft]}>
              <Text style={styles.summaryLabel}>Total Fee</Text>
              <Text style={styles.summaryAmount}>{formatINR(summaryTotalFee)}</Text>
              <View style={styles.summaryDivider} />
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryAmountSmall}>{formatINR(summaryDiscount)}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardRight]}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={styles.summaryAmount}>{formatINR(summaryPaid)}</Text>
              <View style={styles.summaryDivider} />
              <Text style={styles.summaryLabel}>Due</Text>
              <Text style={[styles.summaryAmountSmall, styles.summaryDueAmount]}>{formatINR(summaryDue)}</Text>
            </View>
          </View>

          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thFee]}>Fee Type</Text>
              <Text style={styles.th}>Discount</Text>
              <Text style={styles.th}>Total</Text>
              <Text style={styles.th}>Paid</Text>
              <Text style={styles.th}>Due</Text>
              <Text style={styles.th}>Date</Text>
            </View>

            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.tableBody}>
              {feeRows.length ? (
                feeRows.map((row) => (
                  <View key={row.key} style={styles.tableRow}>
                    <Text style={[styles.td, styles.tdFee]} numberOfLines={2}>
                      {row.label}
                    </Text>
                    <Text style={styles.td}>{formatINR(row.discount)}</Text>
                    <Text style={styles.td}>{formatINR(row.amount)}</Text>
                    <Text style={styles.td}>{formatINR(row.paid)}</Text>
                    <Text style={styles.td}>{formatINR(row.due)}</Text>
                    <Text style={styles.td}>{row.paymentDate || '-'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No fee breakdown available.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return embedded ? <View style={styles.embeddedCard}>{content}</View> : <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>;
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F6F7' },
  content: { flex: 1, padding: 16, paddingBottom: 20 },
  embeddedContent: { flex: 1, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 20 },
  embeddedShell: { flex: 1, backgroundColor: '#F6F6F7' },
  embeddedCard: { marginHorizontal: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerBrand: { width: 36, alignItems: 'flex-start' },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#666', textAlign: 'center' },
  logo: { width: 30, height: 30 },
  backBtn: { backgroundColor: '#404040', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  tabBtn: {
    borderWidth: 1,
    borderColor: '#D8D8DD',
    borderRadius: 18,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  tabBtnActive: {
    backgroundColor: '#404040',
    borderColor: '#404040',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#222' },
  tabTextActive: { color: '#fff' },
  studentDataWrap: { paddingBottom: 8 },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoCard: {
    width: '31.5%',
    minWidth: 92,
    backgroundColor: '#FBF4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6D6DA',
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  infoCardWide: {
    width: '64%',
    minWidth: 180,
    backgroundColor: '#FBF4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6D6DA',
    padding: 12,
    marginBottom: 8,
  },
  infoLabel: { fontSize: 12, color: '#777', marginBottom: 8, textAlign: 'center' },
  infoValue: { fontSize: 15, color: '#222', fontWeight: '800', textAlign: 'center' },
  transactionWrap: { flex: 1 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  summaryCard: {
    width: '48%',
    minHeight: 108,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    justifyContent: 'center',
  },
  summaryCardLeft: { backgroundColor: '#D7E8C9', marginRight: 8 },
  summaryCardRight: { backgroundColor: '#F2EE9E', marginLeft: 8 },
  summaryLabel: { fontSize: 12, color: '#666', fontWeight: '700' },
  summaryAmount: { marginTop: 6, fontSize: 18, color: '#111', fontWeight: '800' },
  summaryAmountSmall: { marginTop: 4, fontSize: 17, color: '#111', fontWeight: '800' },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  summaryDueAmount: { color: '#111' },
  tableCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E2E6',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f6f6f7',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  th: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },
  thFee: { flex: 1.25, textAlign: 'left' },
  tableBody: {
    paddingBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8EC',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  td: {
    flex: 1,
    fontSize: 11,
    color: '#222',
    textAlign: 'center',
  },
  tdFee: { flex: 1.25, textAlign: 'left', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#555' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 6, padding: 14 },
});

export default ParentFees;
