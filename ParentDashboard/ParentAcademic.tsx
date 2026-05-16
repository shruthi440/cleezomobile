import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorContext } from '../ErrorContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ParentAcademic'>;
type AcademicViewProps = Props & { embedded?: boolean };

interface AcademicSubject {
  name?: string;
  subject?: string;
  subject_name?: string;
  title?: string;
  label?: string;
  FA?: Array<number | string | null>;
  SA?: Array<number | string | null>;
  tests?: Record<
    string,
    { obtained?: number | string | null; max?: number | string | null }
  >;
}

const getSubjectDisplayName = (subject: AcademicSubject, index: number) =>
  subject.name ||
  subject.subject ||
  subject.subject_name ||
  subject.title ||
  subject.label ||
  `Subject ${index + 1}`;

const computeAcademicSummary = (
  performance: AcademicSubject[],
  testTypes: any[],
) => {
  if (!performance.length) return { grade: '-', percentage: '0.00' };

  const fallbackTermRows = [
    { label: 'FA1', key: 'FA1' },
    { label: 'FA2', key: 'FA2' },
    { label: 'SA1', key: 'SA1' },
    { label: 'FA3', key: 'FA3' },
    { label: 'FA4', key: 'FA4' },
    { label: 'SA2', key: 'SA2' },
  ];

  const termRows = (testTypes || []).length
    ? testTypes
        .filter((row: any) => row?.key && row?.label)
        .map((row: any) => ({ key: row.key, label: row.label }))
    : fallbackTermRows;

  const getLegacyMarkForRow = (subj: AcademicSubject, rowKey: string) => {
    const match = String(rowKey || '')
      .toUpperCase()
      .match(/^(FA|SA)(\d+)$/);
    if (!match) return { mark: '-', max: 0 };

    const type = match[1];
    const index = Number(match[2]) - 1;
    const mark = type === 'FA' ? subj?.FA?.[index] : subj?.SA?.[index];
    const max = type === 'FA' ? 20 : 80;

    return {
      mark: mark ?? '-',
      max: mark === null || mark === undefined ? 0 : max,
    };
  };

  const getMarkForRow = (subj: AcademicSubject, row: any) => {
    const testEntry = subj?.tests?.[row?.key];
    if (testEntry?.obtained !== null && testEntry?.obtained !== undefined) {
      return testEntry.obtained;
    }
    return getLegacyMarkForRow(subj, row?.key).mark;
  };

  const getMaxForRow = (subj: AcademicSubject, row: any) => {
    const testEntry = subj?.tests?.[row?.key];
    if (testEntry?.max !== null && testEntry?.max !== undefined) {
      return Number(testEntry.max) || 0;
    }
    return getLegacyMarkForRow(subj, row?.key).max;
  };

  let obtained = 0;
  let total = 0;

  performance.forEach(subj => {
    termRows.forEach(row => {
      const mark = getMarkForRow(subj, row);
      const maxMark = getMaxForRow(subj, row);
      const numericMark = Number(mark);

      if (
        mark !== '-' &&
        mark !== null &&
        mark !== undefined &&
        !Number.isNaN(numericMark) &&
        maxMark > 0
      ) {
        obtained += numericMark;
        total += maxMark;
      }
    });
  });

  const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : '0.00';
  const pct = Number(percentage);
  let grade = 'D';
  if (pct >= 90) grade = 'A+';
  else if (pct >= 80) grade = 'A';
  else if (pct >= 70) grade = 'B+';
  else if (pct >= 60) grade = 'B';
  else if (pct >= 50) grade = 'C';

  return { grade, percentage };
};

const computeTestSummary = (
  performance: AcademicSubject[],
  rowKey: string,
  testTypes: any[],
) => {
  if (!performance.length || !rowKey) return { grade: '-', percentage: '0.00' };

  const fallbackTermRows = [
    { label: 'FA1', key: 'FA1' },
    { label: 'FA2', key: 'FA2' },
    { label: 'SA1', key: 'SA1' },
    { label: 'FA3', key: 'FA3' },
    { label: 'FA4', key: 'FA4' },
    { label: 'SA2', key: 'SA2' },
  ];

  const termRows = (testTypes || []).length
    ? testTypes
        .filter((row: any) => row?.key && row?.label)
        .map((row: any) => ({ key: row.key, label: row.label }))
    : fallbackTermRows;

  const matchedRow = termRows.find((row: any) => row.key === rowKey);
  if (!matchedRow) return { grade: '-', percentage: '0.00' };

  let obtained = 0;
  let total = 0;

  performance.forEach((subj) => {
    const testEntry = subj?.tests?.[matchedRow.key];
    let mark: number | string | null | undefined = testEntry?.obtained;
    let maxMark: number | string | null | undefined = testEntry?.max;

    if (mark === null || mark === undefined) {
      const legacy = String(matchedRow.key || '')
        .toUpperCase()
        .match(/^(FA|SA)(\d+)$/);
      if (legacy) {
        const type = legacy[1];
        const index = Number(legacy[2]) - 1;
        mark = type === 'FA' ? subj?.FA?.[index] : subj?.SA?.[index];
        maxMark = type === 'FA' ? 20 : 80;
      }
    }

    const numericMark = Number(mark);
    const numericMax = Number(maxMark);

    if (
      mark !== '-' &&
      mark !== null &&
      mark !== undefined &&
      !Number.isNaN(numericMark) &&
      numericMax > 0
    ) {
      obtained += numericMark;
      total += numericMax;
    }
  });

  const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : '0.00';
  const pct = Number(percentage);
  let grade = 'D';
  if (pct >= 90) grade = 'A+';
  else if (pct >= 80) grade = 'A';
  else if (pct >= 70) grade = 'B+';
  else if (pct >= 60) grade = 'B';
  else if (pct >= 50) grade = 'C';

  return { grade, percentage };
};

const ParentAcademic: React.FC<AcademicViewProps> = ({
  navigation,
  embedded = false,
}) => {
  const { height } = useWindowDimensions();
  const [studentData, setStudentData] = useState<Record<string, any> | null>(
    null,
  );
  const [performance, setPerformance] = useState<AcademicSubject[]>([]);
  const [testTypes, setTestTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = React.useContext(ErrorContext);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const keys = [
          'studentId',
          'username',
          'name',
          'class_name',
          'section',
          'schoolCode',
        ];
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

    loadStudentData();
  }, [showError]);

  useEffect(() => {
    let isMounted = true;

    const fetchPerformance = async () => {
      setLoading(true);
      try {
        if (
          !studentData?.name ||
          !studentData?.class_name ||
          !studentData?.section
        ) {
          setPerformance([]);
          setTestTypes([]);
          return;
        }

        const storedSchoolCode = await AsyncStorage.getItem('schoolCode');
        const schoolCode = studentData?.schoolCode || storedSchoolCode || '';

        if (!schoolCode) {
          setPerformance([]);
          setTestTypes([]);
          return;
        }

        const res = await axios.post(
          'https://cleezoclass.com:4000/api/overall/academic-performance',
          {
            name: studentData.name,
            class_name: studentData.class_name,
            section: studentData.section,
            schoolCode,
          },
        );

        if (!isMounted) return;

        if (Array.isArray(res.data)) {
          setPerformance(res.data || []);
          setTestTypes([]);
        } else {
          setPerformance(
            Array.isArray(res.data?.performance) ? res.data.performance : [],
          );
          setTestTypes(
            Array.isArray(res.data?.testTypes) ? res.data.testTypes : [],
          );
        }
      } catch {
        if (isMounted) {
          showError(
            'Academic Performance Error',
            'Unable to load academic data.',
          );
          setPerformance([]);
          setTestTypes([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPerformance();
    return () => {
      isMounted = false;
    };
  }, [
    studentData?.name,
    studentData?.class_name,
    studentData?.section,
    studentData?.schoolCode,
    showError,
  ]);

  const summary = computeAcademicSummary(performance, testTypes);
  const termRowsForSummary = (testTypes || []).length
    ? testTypes
        .filter((row: any) => row?.key && row?.label)
        .map((row: any) => ({ key: row.key, label: row.label }))
    : [
        { label: 'FA1', key: 'FA1' },
        { label: 'FA2', key: 'FA2' },
        { label: 'SA1', key: 'SA1' },
        { label: 'FA3', key: 'FA3' },
        { label: 'FA4', key: 'FA4' },
        { label: 'SA2', key: 'SA2' },
      ];
  const previousTestRow = termRowsForSummary[termRowsForSummary.length - 1];
  const previousTestSummary = computeTestSummary(performance, previousTestRow?.key, testTypes);
  const termRows = (testTypes || []).length
    ? testTypes
        .filter((row: any) => row?.key && row?.label)
        .map((row: any) => ({ key: row.key, label: row.label }))
    : [
        { label: 'FA1', key: 'FA1' },
        { label: 'FA2', key: 'FA2' },
        { label: 'SA1', key: 'SA1' },
        { label: 'FA3', key: 'FA3' },
        { label: 'FA4', key: 'FA4' },
        { label: 'SA2', key: 'SA2' },
      ];

  const getDisplayMark = (subj: AcademicSubject, row: any) => {
    const testEntry = subj?.tests?.[row?.key];
    if (testEntry?.obtained !== null && testEntry?.obtained !== undefined) {
      return testEntry.obtained;
    }

    const match = String(row?.key || '')
      .toUpperCase()
      .match(/^(FA|SA)(\d+)$/);
    if (!match) return '-';
    const type = match[1];
    const index = Number(match[2]) - 1;
    const mark = type === 'FA' ? subj?.FA?.[index] : subj?.SA?.[index];
    return mark ?? '-';
  };

  const subjectListHeight = Math.max(
    260,
    Math.min(height * 0.5, embedded ? 380 : 460),
  );

  if (loading || !studentData) {
    return (
      <View style={embedded ? styles.embeddedShell : styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Loading academic data...</Text>
        </View>
      </View>
    );
  }

  const content = (
    <View style={embedded ? styles.embeddedContent : styles.content}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerLeftColumn}>
          <Text style={styles.title}>Academic</Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {studentData?.name || '-'} {studentData?.class_name || ''}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRowTop}>
        <View style={[styles.summaryCardTop, styles.summaryCardOverall, styles.summaryCardLeft]}>
          <Text style={styles.summaryLabelPlain}>Overall</Text>
          <Text style={styles.gradeCompact}>{summary.grade}</Text>
          <Text style={styles.percentCompact}>{summary.percentage}%</Text>
        </View>

        <View style={[styles.summaryCardTop, styles.summaryCardPrevious, styles.summaryCardRight]}>
          <Text style={styles.summaryLabelPlain}>Previous Test</Text>
          <Text style={styles.gradeCompact}>{previousTestSummary.grade}</Text>
          <Text style={styles.percentCompact}>
            {previousTestRow?.label || 'Last test'}
          </Text>
        </View>
      </View>

      {!embedded ? (
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack?.()}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {performance.length === 0 ? (
        <Text style={styles.emptyText}>No academic data.</Text>
      ) : (
        <View
          style={[
            styles.subjectsPanel,
            embedded && styles.embeddedSubjectsPanel,
            { maxHeight: subjectListHeight },
          ]}
        >
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.subjectsScrollContent}
          >
            {performance.map((subject, index) => (
              <View
                key={`${subject.name || 'subj'}-${index}`}
                style={styles.subjectCard}
              >
                <Text style={styles.subjectTitle}>
                  {getSubjectDisplayName(subject, index)}
                </Text>
                <View style={styles.rowHeader}>
                  {termRows.map((row: any) => (
                    <Text key={row.key} style={styles.cellHeader}>
                      {row.label}
                    </Text>
                  ))}
                </View>
                <View style={styles.rowData}>
                  {termRows.map((row: any) => (
                    <View key={row.key} style={styles.cell}>
                      <Text style={styles.cellText}>
                        {String(getDisplayMark(subject, row))}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return embedded ? (
    <View style={styles.embeddedCard}>{content}</View>
  ) : (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F6F7' },
  content: { flex: 1, padding: 16, paddingBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeftColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  backRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
  },
  backBtn: {
    backgroundColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },
  embeddedShell: { padding: 0 },
  embeddedHeader: { marginBottom: 12 },
  embeddedTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  embeddedCard: { marginHorizontal: 0 },
  embeddedContent: { flex: 1, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 18,
    marginBottom: 16,
  },
  summaryLabelPlain: { fontSize: 12, color: '#666', fontWeight: '700' },
  summaryLabel: { fontSize: 12, color: '#666', fontWeight: '700' },
  grade: { fontSize: 40, fontWeight: '800', color: '#111', marginTop: 8 },
  percent: { fontSize: 16, color: '#444', marginTop: 4 },
  gradeCompact: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111',
    marginTop: 4,
    textAlign: 'left',
  },
  percentCompact: { fontSize: 14, color: '#444', marginTop: 2, textAlign: 'left' },
  overallSummaryPlain: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom:10,
  },
  summaryRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  summaryCardTop: {
    flex: 1,
    minHeight: 108,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  summaryCardLeft: {
    marginRight: 8,
  },
  summaryCardOverall: {
    backgroundColor: '#D7E8C9',
  },
  summaryCardRight: {
    marginLeft: 8,
  },
  summaryCardPrevious: {
    backgroundColor: '#F2EE9E',
  },
  subjectsPanel: {
    backgroundColor: '#f6f6f7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f6f6f7',
    padding: 12,
    marginBottom: 12,
  },
  embeddedSubjectsPanel: {
    padding: 0,
  },
  subjectsScrollContent: {
    paddingBottom: 4,
  },
  subjectCard: {
    backgroundColor: '#f6f6f7',
    borderRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',   

    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    padding: 14,
    marginBottom: 12,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  rowHeader: { flexDirection: 'row', marginBottom: 8 },
  rowData: { flexDirection: 'row' },
  cellHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  cellText: { fontSize: 12, fontWeight: '700', color: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#555' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
});

export default ParentAcademic;
