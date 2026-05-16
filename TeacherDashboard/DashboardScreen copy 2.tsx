import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker, { errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { createAppStyles } from '../App.styles';

type IconKind = 'material' | 'fontawesome';

type RegisterFormData = {
  student_name: string;
  full_name: string;
  occupation: string;
  mobile_number: string;
  email_id: string;
  address: string;
  dob: string;
  lead_admission_for: string;
  interest_status: string;
  entry_type: 'manual' | 'automatic';
  refer_by: string;
};

type EnrollmentFormData = {
  first_name: string;
  last_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  blood_group: string;
  admission_for: string;
  branch: string;
  address: string;
};

type LeadSummary = {
  id: string | number;
  full_name?: string;
  student_name?: string;
  last_name?: string;
  mother_name?: string;
  dob?: string;
  blood_group?: string;
  branch?: string;
  address?: string;
  mobile_number?: string;
  email_id?: string;
  lead_admission_for?: string;
  reg_no?: string | number;
  ticket_no?: string | number;
  status?: string;
  enrolled?: string | boolean | number;
  admission_paid?: string | number;
  date?: string;
  lead_time?: string;
  entry_type?: string;
  channel?: string;
  channels?: string[];
  assigned_teacher_name?: string;
  assigned_teacher_id?: string | number;
  refer_by?: string;
  tc_document?: string;
  aadhar_document?: string;
  dob_document?: string;
  appeared_document?: string;
  father_id?: string;
  mother_id?: string;
  address_proof?: string;
};

type TeacherSummary = {
  teacher_id: string | number;
  teacher_name: string;
  phone_no?: string;
  subject?: string;
  designation?: string;
};

type CommunicationFormData = {
  lead_id: string;
  comm_date: string;
  comm_time: string;
  channels: string[];
  message: string;
};

type TestCounsellingFormData = {
  lead_id: string;
  teacher_id: string;
  test_date: string;
  test_time: string;
  test_mode: string;
  counselling_required: boolean;
  counselling_date: string;
  counselling_time: string;
};

type ReportType =
  | 'all'
  | 'staff'
  | 'digital'
  | 'automated'
  | 'followup'
  | 'registered'
  | 'timeline'
  | 'lead_profile'
  | 'enrolled';

type ReportRow = {
  id: string | number;
  full_name?: string;
  lead_name?: string;
  refer_by?: string;
  mobile_number?: string;
  email_id?: string;
  reg_no?: string | number;
  ticket_no?: string | number;
  lead_admission_for?: string;
  assigned_teacher_name?: string;
  assigned_teacher_id?: string | number;
  entry_type?: string;
  date?: string;
  lead_time?: string;
  followup_day?: number;
  test_date?: string;
  test_time?: string;
  counselling_required?: string | boolean;
  counselling_date?: string;
  counselling_time?: string;
  status?: string;
  enrolled?: string | boolean | number;
  admission_paid?: string | number;
};

type EnrollmentDocumentKey =
  | 'tc_document'
  | 'father_id'
  | 'appeared_document'
  | 'mother_id'
  | 'dob_document'
  | 'address_proof'
  | 'aadhar_document';

type PickedFile = {
  uri: string;
  name: string;
  type: string;
};

const logoImage: ImageSourcePropType = require('../assets/Cleezo.png');
const heroImage: ImageSourcePropType = require('../assets/StudentReport.png');

const topChips = ['Register', 'Admission', 'Enrollment', 'Communication', 'Test & Couns.', 'Reports'];

const dashboardTiles = [
  { label: 'Register', icon: 'person-add', kind: 'material' as const, chipLabel: 'Register' },
  { label: 'Admission', icon: 'person', kind: 'material' as const, chipLabel: 'Admission' },
  { label: 'Test & Couns.', icon: 'groups', kind: 'material' as const, chipLabel: 'Test & Couns.' },
  { label: 'Enrollment', icon: 'school', kind: 'material' as const, chipLabel: 'Enrollment' },
  { label: 'Communication', icon: 'forum', kind: 'material' as const, chipLabel: 'Communication' },
  { label: 'Report', icon: 'description', kind: 'material' as const, chipLabel: 'Reports' },
];

const campaignCards = [
  {
    title: '14',
    subtitle: 'Posters to 9 Leads',
    footer: '2 sent today',
    icon: 'whatsapp',
    kind: 'fontawesome' as const,
    background: '#D7E7CD',
  },
  {
    title: '18',
    subtitle: 'Templates to 9 Leads',
    footer: '9 sent today',
    icon: 'envelope-o',
    kind: 'fontawesome' as const,
    background: '#F0EE96',
  },
];

const reportCards: Array<{ title: string; subtitle: string; reportType: ReportType; icon: string; kind: IconKind }> = [
  { title: 'Campaigning', subtitle: 'Staff Report', icon: 'groups', kind: 'material', reportType: 'staff' },
  { title: 'Campaigning', subtitle: 'Digital Report', icon: 'campaign', kind: 'material', reportType: 'digital' },
  { title: 'Campaigning', subtitle: 'Automated Report', icon: 'notifications', kind: 'material', reportType: 'automated' },
  { title: 'Follow-up', subtitle: 'Lead wise Report', icon: 'manage-search', kind: 'material', reportType: 'all' },
  { title: 'Admission', subtitle: 'Registered Report', icon: 'person-add', kind: 'material', reportType: 'registered' },
  { title: 'Timeline', subtitle: 'Communication Report', icon: 'schedule', kind: 'material', reportType: 'timeline' },
  { title: 'Admission', subtitle: 'Lead Profile Report', icon: 'badge', kind: 'material', reportType: 'lead_profile' },
  { title: 'Admission', subtitle: 'Enrolled Report', icon: 'verified-user', kind: 'material', reportType: 'enrolled' },
];

const interestStatusOptions = [
  'Interested',
  'Not Interested',
  'Partially Interested',
];

const formatDateCell = (value?: string) => (value ? String(value).split('T')[0] : '-');

const formatTimeCell = (value?: string) => {
  if (!value) return '-';
  const text = String(value).trim();
  return text.length > 8 ? text.slice(11, 19) || text.slice(0, 8) : text.slice(0, 8);
};

const hasValue = (value: unknown) => String(value ?? '').trim().length > 0;

const isTruthyStatus = (value: unknown) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'paid', 'enrolled'].includes(normalized);
};

const normalizeCampaignStaffName = (value: unknown) =>
  String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const isGenericCampaignReferBy = (value: unknown) => {
  const normalized = normalizeCampaignStaffName(value);
  return normalized === 'campaign' || normalized === 'campaigning';
};

const enrollmentDocumentLabels: Record<EnrollmentDocumentKey, string> = {
  tc_document: 'TC Document',
  father_id: 'Father ID',
  appeared_document: 'Apaar',
  mother_id: 'Mother ID',
  dob_document: 'DOB Document',
  address_proof: 'Address Proof',
  aadhar_document: 'Student Aadhar',
};

const renderIcon = (kind: IconKind, name: string, color: string, size: number) => {
  if (kind === 'fontawesome') {
    return <FontAwesome name={name} size={size} color={color} />;
  }

  return <MaterialIcons name={name} size={size} color={color} />;
};

const DashboardScreen = () => {
  const [selectedChip, setSelectedChip] = useState(topChips[1]);
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    student_name: '',
    full_name: '',
    occupation: '',
    mobile_number: '',
    email_id: '',
    address: '',
    dob: '',
    lead_admission_for: '',
    interest_status: '',
    entry_type: 'manual',
    refer_by: '',
  });
  const [photo, setPhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormData>({
    first_name: '',
    last_name: '',
    father_name: '',
    mother_name: '',
    dob: '',
    blood_group: '',
    admission_for: '',
    branch: '',
    address: '',
  });
  const [enrollmentDocs, setEnrollmentDocs] = useState<Record<EnrollmentDocumentKey, PickedFile | null>>({
    tc_document: null,
    father_id: null,
    appeared_document: null,
    mother_id: null,
    dob_document: null,
    address_proof: null,
    aadhar_document: null,
  });
  const [selectedEnrollmentLead, setSelectedEnrollmentLead] = useState<LeadSummary | null>(null);
  const [communicationLeads, setCommunicationLeads] = useState<LeadSummary[]>([]);
  const [selectedCommunicationLead, setSelectedCommunicationLead] = useState<LeadSummary | null>(null);
  const [communicationDateFilter, setCommunicationDateFilter] = useState('');
  const [communicationForm, setCommunicationForm] = useState<CommunicationFormData>({
    lead_id: '',
    comm_date: new Date().toISOString().split('T')[0],
    comm_time: '10:00',
    channels: ['All'],
    message: 'Your daily advertisement',
  });
  const [testLeads, setTestLeads] = useState<LeadSummary[]>([]);
  const [selectedTestLead, setSelectedTestLead] = useState<LeadSummary | null>(null);
  const [availableTeachers, setAvailableTeachers] = useState<TeacherSummary[]>([]);
  const [testPanelTab, setTestPanelTab] = useState<'Test' | 'Counselling'>('Test');
  const [testForm, setTestForm] = useState<TestCounsellingFormData>({
    lead_id: '',
    teacher_id: '',
    test_date: new Date().toISOString().split('T')[0],
    test_time: `${new Date().getHours().toString().padStart(2, '0')}:${new Date()
      .getMinutes()
      .toString()
      .padStart(2, '0')}`,
    test_mode: 'Offline',
    counselling_required: false,
    counselling_date: '',
    counselling_time: '',
  });
  const [referByOptions, setReferByOptions] = useState<string[]>([]);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState('Admission');
  const [popupMessage, setPopupMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrollmentSubmitting, setIsEnrollmentSubmitting] = useState(false);
  const [isCommunicationSubmitting, setIsCommunicationSubmitting] = useState(false);
  const [isTestSubmitting, setIsTestSubmitting] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [activeReportType, setActiveReportType] = useState<ReportType>('digital');
  const [reportSearch, setReportSearch] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const { width, height } = useWindowDimensions();
  const phoneWidth = Math.min(Math.max(width - 24, 320), 390);
  const phoneHeight = Math.min(Math.max(height - 24, 720), 860);
  const styles = createAppStyles({ phoneWidth, phoneHeight });
  const currentModuleIndex = Math.max(0, topChips.indexOf(selectedChip));
  const [moduleOpen, setModuleOpen] = useState(false);
  const showAdmissionPanel = selectedChip === 'Register' || selectedChip === 'Admission';
  const showEnrollmentPanel = selectedChip === 'Enrollment';
  const showCommunicationPanel = selectedChip === 'Communication';
  const showTestPanel = selectedChip === 'Test & Couns.';
  const showReportPanel = selectedChip === 'Reports';
  const currentModuleLabel = selectedChip;
  const openModule = (chip: string) => {
    setModuleOpen(true);
    setSelectedChip(chip);
  };
  const closeModule = () => {
    setModuleOpen(false);
    setSelectedChip(topChips[1]);
  };
  const goToPreviousModule = () => {
    const previousIndex = currentModuleIndex > 0 ? currentModuleIndex - 1 : topChips.length - 1;
    setModuleOpen(true);
    setSelectedChip(topChips[previousIndex]);
  };
  const goToNextModule = () => {
    const nextIndex = currentModuleIndex < topChips.length - 1 ? currentModuleIndex + 1 : 0;
    setModuleOpen(true);
    setSelectedChip(topChips[nextIndex]);
  };

  const getValidSchoolCode = async () => {
    const raw = String((await AsyncStorage.getItem('schoolCode')) || '').trim();
    if (!raw) return '';
    const lowered = raw.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined') return '';
    return raw;
  };

  const normalizeComparableText = (value: unknown) =>
    String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

  const handleRegisterField = (name: keyof RegisterFormData, value: string) => {
    let formattedValue = value;

    if (name === 'mobile_number') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (['full_name', 'student_name', 'occupation'].includes(name)) {
      const onlyLetters = value.replace(/[^a-zA-Z ]/g, '');
      formattedValue = onlyLetters.replace(/\b\w+/g, (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    } else if (name === 'email_id') {
      formattedValue = value.slice(0, 100);
    } else if (name === 'address') {
      formattedValue = value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ');
    }

    setRegisterForm((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const resetRegisterForm = () => {
    setRegisterForm({
      student_name: '',
      full_name: '',
      occupation: '',
      mobile_number: '',
      email_id: '',
      address: '',
      dob: '',
      lead_admission_for: '',
      interest_status: '',
      entry_type: 'manual',
      refer_by: '',
    });
    setPhoto(null);
  };

  const resetEnrollmentForm = () => {
    setEnrollmentForm({
      first_name: '',
      last_name: '',
      father_name: '',
      mother_name: '',
      dob: '',
      blood_group: '',
      admission_for: '',
      branch: '',
      address: '',
    });
    setEnrollmentDocs({
      tc_document: null,
      father_id: null,
      appeared_document: null,
      mother_id: null,
      dob_document: null,
      address_proof: null,
      aadhar_document: null,
    });
    setSelectedEnrollmentLead(null);
  };

  const resetCommunicationForm = () => {
    setCommunicationForm((prev) => ({
      ...prev,
      lead_id: '',
      message: 'Your daily advertisement',
      channels: ['All'],
      comm_date: new Date().toISOString().split('T')[0],
      comm_time: '10:00',
    }));
    setSelectedCommunicationLead(null);
  };

  const resetTestForm = () => {
    setTestForm((prev) => ({
      ...prev,
      lead_id: '',
      teacher_id: '',
      test_date: new Date().toISOString().split('T')[0],
      test_time: `${new Date().getHours().toString().padStart(2, '0')}:${new Date()
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      test_mode: 'Offline',
      counselling_required: false,
      counselling_date: '',
      counselling_time: '',
    }));
    setSelectedTestLead(null);
    setTestPanelTab('Test');
  };

  const applyEnrollmentLead = (lead: LeadSummary) => {
    setSelectedEnrollmentLead(lead);
    setEnrollmentForm({
      first_name: lead.student_name || '',
      last_name: lead.last_name || '',
      father_name: lead.full_name || '',
      mother_name: lead.mother_name || '',
      dob: lead.dob ? String(lead.dob).split('T')[0] : '',
      blood_group: lead.blood_group || '',
      admission_for: lead.lead_admission_for || '',
      branch: lead.branch || '',
      address: lead.address || '',
    });
  };

  const applyCommunicationLead = (lead: LeadSummary) => {
    setSelectedCommunicationLead(lead);
    setCommunicationForm((prev) => ({ ...prev, lead_id: String(lead.id) }));
  };

  const applyTestLead = (lead: LeadSummary) => {
    setSelectedTestLead(lead);
    setTestForm((prev) => ({ ...prev, lead_id: String(lead.id) }));
  };

  const handlePhotoPick = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
      });

      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Image Picker', response.errorMessage);
        return;
      }

      const asset: Asset | undefined = response.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Image Picker', 'Could not load the selected image.');
        return;
      }

      setPhoto({
        uri: asset.uri,
        name: asset.fileName || `lead-photo-${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
    } catch (error: any) {
      Alert.alert('Image Picker', error?.message || 'Unable to pick image');
    }
  };

  const handleEnrollmentDocumentPick = async (key: EnrollmentDocumentKey) => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const file = result?.[0];
      if (!file?.uri) {
        Alert.alert('Document Picker', 'Could not load the selected file.');
        return;
      }

      setEnrollmentDocs((prev) => ({
        ...prev,
        [key]: {
          uri: file.uri,
          name: file.name || `${key}-${Date.now()}`,
          type: file.type || 'application/octet-stream',
        },
      }));
    } catch (error: any) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Document Picker', error?.message || 'Unable to pick document');
    }
  };

  useEffect(() => {
    const loadReferByOptions = async () => {
      const schoolCode = await getValidSchoolCode();
      if (!schoolCode) return;

      try {
        const [usersRes, campaignStaffRes] = await Promise.all([
          fetch('https://cleezoclass.com:4000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              schoolCode,
              user_type: 'teacher',
            }),
          }),
          fetch(
            `https://cleezoclass.com:4000/api/lead-staff?schoolCode=${encodeURIComponent(
              schoolCode
            )}`
          ),
        ]);

        const usersData = await usersRes.json();
        const campaignStaffData = await campaignStaffRes.json();
        const combinedStaff = [
          ...(Array.isArray(usersData) ? usersData : []),
          ...(Array.isArray(campaignStaffData)
            ? campaignStaffData
            : Array.isArray((campaignStaffData as any)?.leads)
              ? (campaignStaffData as any).leads
              : Array.isArray((campaignStaffData as any)?.data)
                ? (campaignStaffData as any).data
                : []),
        ];

        const options = Array.from(
          new Set(
            combinedStaff
              .map((item: any) =>
                String(
                  item?.teacher_name ??
                    item?.name ??
                    item?.full_name ??
                    item?.assigned_teacher_name ??
                    item?.refer_by ??
                    ''
                ).trim()
              )
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));

        setReferByOptions(options);
      } catch (error) {
        console.error('Failed to load refer-by options:', error);
        setReferByOptions([]);
      }
    };

    loadReferByOptions();
  }, []);

  useEffect(() => {
    const loadLeads = async () => {
      const schoolCode = await getValidSchoolCode();
      if (!schoolCode) return;

      try {
        setPanelLoading(true);
        const response = await fetch(
          `https://cleezoclass.com:4000/api/communication/leads?schoolCode=${encodeURIComponent(
            schoolCode
          )}`
        );
        const data = await response.json();
        const leads = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.leads)
            ? (data as any).leads
            : Array.isArray((data as any)?.data)
              ? (data as any).data
              : [];

        setCommunicationLeads(leads);
        setTestLeads(leads);

        const firstLead = leads[0];
        if (firstLead?.id !== undefined) {
          setCommunicationForm((prev) =>
            prev.lead_id ? prev : { ...prev, lead_id: String(firstLead.id) }
          );
          setTestForm((prev) => (prev.lead_id ? prev : { ...prev, lead_id: String(firstLead.id) }));
          setSelectedCommunicationLead((prev) => prev || firstLead);
          setSelectedTestLead((prev) => prev || firstLead);
          setSelectedEnrollmentLead((prev) => prev || firstLead);
          setEnrollmentForm((prev) =>
            prev.first_name || prev.father_name ? prev : {
              ...prev,
              first_name: firstLead.student_name || '',
              last_name: firstLead.last_name || '',
              father_name: firstLead.full_name || '',
              mother_name: firstLead.mother_name || '',
              dob: firstLead.dob ? String(firstLead.dob).split('T')[0] : '',
              blood_group: firstLead.blood_group || '',
              admission_for: firstLead.lead_admission_for || '',
              branch: firstLead.branch || '',
              address: firstLead.address || '',
            }
          );
        }
      } catch (error) {
        console.error('Failed to load communication leads:', error);
        setCommunicationLeads([]);
        setTestLeads([]);
      } finally {
        setPanelLoading(false);
      }
    };

    loadLeads();
  }, []);

  useEffect(() => {
    const loadTeachers = async () => {
      const schoolCode = await getValidSchoolCode();
      if (!schoolCode || !showTestPanel) return;
      if (!testForm.test_date || !testForm.test_time) return;

      try {
        setPanelLoading(true);
        const response = await fetch(
          `https://cleezoclass.com:4000/api/chief/available-teachers-marketing?schoolCode=${encodeURIComponent(
            schoolCode
          )}&date=${encodeURIComponent(testForm.test_date)}&time=${encodeURIComponent(
            testForm.test_time
          )}`
        );
        const data = await response.json();
        const teachers = Array.isArray(data?.available_teachers)
          ? data.available_teachers
          : Array.isArray(data)
            ? data
            : [];

        setAvailableTeachers(teachers);
        const firstTeacher = teachers[0];
        if (firstTeacher?.teacher_id !== undefined) {
          setTestForm((prev) =>
            prev.teacher_id ? prev : { ...prev, teacher_id: String(firstTeacher.teacher_id) }
          );
        }
      } catch (error) {
        console.error('Failed to load available teachers:', error);
        setAvailableTeachers([]);
      } finally {
        setPanelLoading(false);
      }
    };

    loadTeachers();
  }, [showTestPanel, testForm.test_date, testForm.test_time]);

  useEffect(() => {
    const loadReports = async () => {
      const schoolCode = await getValidSchoolCode();
      if (!schoolCode || !showReportPanel) return;

      setReportLoading(true);
      setReportError('');

      const params = new URLSearchParams({
        schoolCode,
        reportType:
          activeReportType === 'staff' || activeReportType === 'automated'
            ? 'all'
            : activeReportType,
        page: '1',
        limit: '3000',
        sortBy: 'date',
        sortDir: 'DESC',
      });

      if (reportSearch.trim()) {
        params.set('search', reportSearch.trim());
      }

      fetch(`https://cleezoclass.com:4000/api/frontdesk/reports/leads?${params.toString()}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Failed to load report data');
          setReportRows(Array.isArray(data?.rows) ? data.rows : []);
        })
        .catch((error) => {
          if (error?.name === 'AbortError') return;
          setReportRows([]);
          setReportError(error?.message || 'Failed to load report data');
        })
        .finally(() => setReportLoading(false));
    };

    loadReports();
  }, [showReportPanel, activeReportType, reportSearch]);

  const reportVisibleRows = reportRows.filter((row) => {
    if (activeReportType === 'staff') {
      const referByName = normalizeCampaignStaffName(row.refer_by);
      if (!referByName || isGenericCampaignReferBy(referByName)) return false;
      return hasValue(row.refer_by);
    }

    if (activeReportType === 'digital') {
      return isGenericCampaignReferBy(row.refer_by);
    }

    if (activeReportType === 'automated') {
      const isLeadNameEmpty = !hasValue(row.lead_name);
      const isRegNoEmpty = !hasValue(row.reg_no);
      const isTicketNoEmpty = !hasValue(row.ticket_no);
      return isLeadNameEmpty && isRegNoEmpty && isTicketNoEmpty;
    }

    if (activeReportType === 'timeline') {
      const hasTeacher = hasValue(row.assigned_teacher_name) || hasValue(row.assigned_teacher_id);
      const hasTestOrCounselling =
        hasValue(row.test_date) ||
        hasValue(row.test_time) ||
        hasValue(row.counselling_date) ||
        hasValue(row.counselling_time);
      return hasTeacher && hasTestOrCounselling;
    }

    if (activeReportType === 'enrolled') {
      const statusEnrolled = String(row.status || '').trim().toLowerCase() === 'enrolled';
      const enrolledStatus = isTruthyStatus(row.enrolled);
      const paidAdmission = Number(row.admission_paid || 0) > 0;
      return statusEnrolled || (enrolledStatus && paidAdmission);
    }

    if (activeReportType === 'registered') {
      const referByName = normalizeCampaignStaffName(row.refer_by);
      const isDigitalCampaignLead = isGenericCampaignReferBy(referByName);
      const isStaffCampaignLead = !!referByName && !isDigitalCampaignLead;
      return !isDigitalCampaignLead && !isStaffCampaignLead;
    }

    return true;
  });

  const reportTableColumns =
    activeReportType === 'timeline'
      ? ['ID', 'Name', 'Class', 'Mobile', 'Teacher', 'Test Date', 'Test Time', 'Counselling Date', 'Counselling Time']
      : activeReportType === 'enrolled'
        ? ['ID', 'Name', 'Class', 'Mobile', 'Reg No', 'Teacher', 'Enrolled', 'Admission Fee Paid']
        : [
            'ID',
            'Name',
            activeReportType === 'staff' ? 'Campaign Staff' : 'Lead Name',
            'Mobile',
            'Email',
            'Reg No',
            ...(activeReportType === 'digital' ? [] : [activeReportType === 'staff' ? 'Lead Name' : 'Teacher']),
            ...(activeReportType === 'digital' ? [] : ['Entry']),
            'Date',
            'Time',
          ];

  const isDuplicateLead = async (schoolCode: string) => {
    const res = await fetch('https://cleezoclass.com:4000/api/check-duplicate-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolCode,
        ...registerForm,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Unable to check duplicate lead');
    }

    return data;
  };

  const scheduleLeadMessages = async (schoolCode: string, data: any) => {
    if (!data?.email_id) return;

    const message = `Hi ${data.full_name}! 🎉\nYour child registration is successful.\n\nReg No: ${data.reg_no}\nTicket No: ${data.ticket_no}\n\n🔐 Parent Login: https://cleezoclass.com/CRM/ParentAdmissionLogin?schoolCode=${encodeURIComponent(
      schoolCode
    )}`;

    const schedule: Array<Record<string, string | number | string[]>> = [];
    const now = new Date();
    const immediateTime = new Date(now.getTime() + 60 * 1000);
    const immediateTimeStr = immediateTime.toTimeString().split(' ')[0];

    schedule.push({
      leadId: data.id,
      leadName: data.full_name,
      phone: data.mobile_number,
      email: data.email_id,
      date: now.toISOString().split('T')[0],
      time: immediateTimeStr,
      channels: ['Mail'],
      message,
      schoolCode,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(10, 0, 0, 0);

    for (let i = 0; i < 29; i++) {
      const sendDate = new Date(startDate);
      sendDate.setDate(startDate.getDate() + i);

      schedule.push({
        leadId: data.id,
        leadName: data.full_name,
        phone: data.mobile_number,
        email: data.email_id,
        date: sendDate.toISOString().split('T')[0],
        time: '10:00:00',
        channels: ['Mail'],
        message,
        schoolCode,
      });
    }

    await fetch('https://cleezoclass.com:4000/api/schedule-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule, schoolCode }),
    });
  };

  const scheduleCommunicationMessages = async () => {
    const schoolCode = await getValidSchoolCode();
    if (!schoolCode) {
      setPopupTitle('Communication');
      setPopupMessage('School Code is missing. Please login again.');
      setShowPopup(true);
      return;
    }

    const lead = communicationLeads.find((item) => String(item.id) === communicationForm.lead_id);
    if (!lead) {
      setPopupTitle('Communication');
      setPopupMessage('Please choose a lead for communication.');
      setShowPopup(true);
      return;
    }

    if (!communicationForm.comm_date || !communicationForm.comm_time) {
      setPopupTitle('Communication');
      setPopupMessage('Please choose both communication date and time.');
      setShowPopup(true);
      return;
    }

    if (communicationForm.channels.length === 0) {
      setPopupTitle('Communication');
      setPopupMessage('Please choose at least one communication channel.');
      setShowPopup(true);
      return;
    }

    const startDate = new Date(`${communicationForm.comm_date}T${communicationForm.comm_time}:00`);
    const schedule = Array.from({ length: 30 }, (_, index) => {
      const sendDate = new Date(startDate);
      sendDate.setDate(startDate.getDate() + index);

      return {
        leadId: lead.id,
        leadName: lead.full_name || lead.student_name || '',
        phone: lead.mobile_number || '',
        email: lead.email_id || '',
        date: sendDate.toISOString().split('T')[0],
        time: sendDate.toTimeString().split(' ')[0],
        channels: communicationForm.channels,
        message: communicationForm.message || 'Your daily advertisement',
        schoolCode,
      };
    });

    await fetch('https://cleezoclass.com:4000/api/schedule-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule, schoolCode }),
    });
  };

  const createEnrollmentLogin = async (schoolCode: string) => {
    const response = await fetch('https://cleezoclass.com:4000/api/create-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: enrollmentForm.first_name,
        last_name: enrollmentForm.last_name,
        father_name: enrollmentForm.father_name,
        dob: enrollmentForm.dob,
        address: enrollmentForm.address,
        admission_for: enrollmentForm.admission_for,
        schoolCode,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || 'Failed to create login for the enrolled student.');
    }
    return result;
  };

  const submitEnrollment = async () => {
    const schoolCode = await getValidSchoolCode();
    if (!schoolCode) {
      setPopupTitle('Enrollment');
      setPopupMessage('School Code is missing. Please login again.');
      setShowPopup(true);
      return;
    }

    const missingFields: string[] = [];
    if (!enrollmentForm.first_name) missingFields.push('first name');
    if (!enrollmentForm.father_name) missingFields.push('father name');
    if (!enrollmentForm.dob) missingFields.push('date of birth');
    if (!enrollmentForm.admission_for) missingFields.push('admission for');
    if (!enrollmentForm.address) missingFields.push('address');

    if (missingFields.length > 0) {
      setPopupTitle('Enrollment');
      setPopupMessage(`Kindly fill ${missingFields.join(', ')} to proceed.`);
      setShowPopup(true);
      return;
    }

    setIsEnrollmentSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(enrollmentForm).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, String(value));
        }
      });
      (Object.entries(enrollmentDocs) as Array<[EnrollmentDocumentKey, PickedFile | null]>).forEach(
        ([key, file]) => {
          if (file) {
            form.append(
              key,
              {
                uri: file.uri,
                name: file.name,
                type: file.type,
              } as any
            );
          }
        }
      );
      form.append('schoolCode', schoolCode);

      const response = await fetch('https://cleezoclass.com:4000/enrollment', {
        method: 'POST',
        body: form,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'We were unable to save the enrollment details.');
      }

      try {
        await createEnrollmentLogin(schoolCode);
      } catch (loginError: any) {
        console.error('Login creation failed:', loginError);
      }

      setPopupTitle('Enrollment');
      setPopupMessage('Enrollment submitted successfully.');
      setShowPopup(true);
      resetEnrollmentForm();
    } catch (error: any) {
      setPopupTitle('Enrollment');
      setPopupMessage(error?.message || 'Enrollment submission failed');
      setShowPopup(true);
    } finally {
      setIsEnrollmentSubmitting(false);
    }
  };

  const submitCommunication = async () => {
    setIsCommunicationSubmitting(true);
    try {
      await scheduleCommunicationMessages();
      setPopupTitle('Communication');
      setPopupMessage('Communication has been scheduled for the next 30 days.');
      setShowPopup(true);
      resetCommunicationForm();
    } catch (error: any) {
      setPopupTitle('Communication');
      setPopupMessage(error?.message || 'Unable to schedule communication');
      setShowPopup(true);
    } finally {
      setIsCommunicationSubmitting(false);
    }
  };

  const submitTestCounselling = async () => {
    const schoolCode = await getValidSchoolCode();
    if (!schoolCode) {
      setPopupTitle('Test & Couns.');
      setPopupMessage('School Code is missing. Please login again.');
      setShowPopup(true);
      return;
    }

    const lead = testLeads.find((item) => String(item.id) === testForm.lead_id);
    const teacher = availableTeachers.find((item) => String(item.teacher_id) === testForm.teacher_id);

    if (!lead || !teacher) {
      setPopupTitle('Test & Couns.');
      setPopupMessage('Please choose both a lead and a teacher.');
      setShowPopup(true);
      return;
    }

    if (testForm.counselling_required && (!testForm.counselling_date || !testForm.counselling_time)) {
      setPopupTitle('Test & Couns.');
      setPopupMessage('Please choose counselling date and time.');
      setShowPopup(true);
      return;
    }

    setIsTestSubmitting(true);
    try {
      const response = await fetch('https://cleezoclass.com:4000/api/api/add-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateType: 'ASSIGN_TEACHER',
          lead_id: lead.id,
          schoolCode,
          assigned_teacher_id: teacher.teacher_id,
          assigned_teacher_name: teacher.teacher_name,
          test_date: testForm.test_date,
          test_time: testForm.test_time,
          test_mode: testForm.test_mode,
          counselling_required: testForm.counselling_required ? 'Yes' : 'No',
          counselling_date: testForm.counselling_required ? testForm.counselling_date : null,
          counselling_time: testForm.counselling_required ? testForm.counselling_time : null,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || 'Unable to assign the teacher.');
      }

      setPopupTitle('Test & Couns.');
      setPopupMessage('Teacher assignment saved successfully.');
      setShowPopup(true);
      resetTestForm();
    } catch (error: any) {
      setPopupTitle('Test & Couns.');
      setPopupMessage(error?.message || 'Unable to assign the teacher.');
      setShowPopup(true);
    } finally {
      setIsTestSubmitting(false);
    }
  };

  const toggleCommunicationChannel = (channel: string) => {
    setCommunicationForm((prev) => {
      if (channel === 'All') {
        return {
          ...prev,
          channels: prev.channels.includes('All') ? [] : ['All'],
        };
      }

      const nextChannels = prev.channels.includes('All')
        ? prev.channels.filter((item) => item !== 'All').concat(channel)
        : prev.channels.includes(channel)
          ? prev.channels.filter((item) => item !== channel)
          : [...prev.channels, channel];

      return { ...prev, channels: nextChannels };
    });
  };

  const submitLead = async (allowDuplicate = false) => {
    const schoolCode = await getValidSchoolCode();
    if (!schoolCode) {
      setPopupTitle('Admission');
      setPopupMessage('School Code is missing. Please login again.');
      setShowPopup(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append('schoolCode', schoolCode);
      (Object.keys(registerForm) as Array<keyof RegisterFormData>).forEach((key) => {
        dataToSend.append(key, registerForm[key]);
      });
      dataToSend.append('allow_duplicate', allowDuplicate ? 'true' : 'false');
      dataToSend.append('test_type', '');
      dataToSend.append('test_date', '');
      dataToSend.append('counselling_required', '');
      dataToSend.append('counselling_date', '');
      dataToSend.append('counselling_time', '');

      if (photo) {
        dataToSend.append(
          'photo',
          {
            uri: photo.uri,
            name: photo.name,
            type: photo.type,
          } as any
        );
      }

      const res = await fetch('https://cleezoclass.com:4000/api/add-lead', {
        method: 'POST',
        body: dataToSend,
      });

      const data = await res.json();
      if (res.status === 409 && data?.duplicate && !allowDuplicate) {
        setPopupTitle('Duplicate Lead');
        setPopupMessage(
          data?.error || 'You already have submitted this lead. Do you want to submit it again?'
        );
        setShowPopup(true);
        setShowDuplicateConfirm(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Lead submission failed');
      }

      setPopupTitle('Admission');
      setPopupMessage('Lead submitted successfully!');
      setShowPopup(true);

      try {
        await scheduleLeadMessages(schoolCode, data);
      } catch (error) {
        console.error('Failed to schedule QR lead emails:', error);
      }

      resetRegisterForm();
    } catch (error: any) {
      setPopupTitle('Admission');
      setPopupMessage(error?.message || 'Lead submission failed');
      setShowPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPress = async () => {
    const schoolCode = await getValidSchoolCode();
    if (!schoolCode) {
      setPopupTitle('Admission');
      setPopupMessage('School Code is missing. Please login again.');
      setShowPopup(true);
      return;
    }

    try {
      const duplicateResult = await isDuplicateLead(schoolCode);
      if (duplicateResult?.duplicate) {
        setPopupTitle('Duplicate Lead');
        setPopupMessage(
          duplicateResult?.error ||
            'You already have submitted this lead. Do you want to submit it again?'
        );
        setShowPopup(true);
        setShowDuplicateConfirm(true);
        return;
      }

      await submitLead(false);
    } catch (error: any) {
      setPopupTitle('Admission');
      setPopupMessage(error?.message || 'Unable to verify duplicate lead');
      setShowPopup(true);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E0F" />

      <View style={styles.background}>
        <View style={styles.phoneShell}>
          <View style={styles.phoneFrame}>
            <View style={styles.notch} />

            <View style={styles.statusRow}>
              <Text style={styles.timeText}>4:00</Text>
              <View style={styles.statusIcons}>
                <Text style={styles.statusGlyph}>▂▅▇</Text>
                <Text style={[styles.statusGlyph, styles.statusGlyphSpacing]}>⌁</Text>
                <Text style={[styles.statusGlyph, styles.statusGlyphSpacing]}>▭</Text>
              </View>
            </View>

            <View style={styles.toolbar}>
              <Pressable style={styles.toolbarButton}>
                <Text style={styles.toolbarButtonText}>☰</Text>
              </Pressable>
              <View style={styles.toolbarSpacer} />
              <Pressable style={styles.toolbarButton}>
                <Text style={styles.toolbarButtonText}>◌</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={[
                styles.scrollContent,
                moduleOpen && styles.scrollContentOpen,
              ]}
              showsVerticalScrollIndicator={false}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {topChips.map((chip, index) => {
                  const active = selectedChip === chip;

                  return (
                    <Pressable
                      key={chip}
                      onPress={() => openModule(chip)}
                      style={[
                        styles.chip,
                        index !== topChips.length - 1 && styles.chipSpacing,
                        active ? styles.chipActive : styles.chipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active ? styles.chipTextActive : styles.chipTextInactive,
                        ]}
                      >
                        {chip}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {moduleOpen && (
                <>
                  <View style={styles.moduleHeaderCard}>
                    <View style={styles.moduleHeaderTopRow}>
                      <View style={styles.moduleHeaderTextBlock}>
                        <Text style={styles.moduleHeaderTitle}>{currentModuleLabel}</Text>
                        <Text style={styles.moduleHeaderSubtitle}>
                          One module at a time, matching the desktop flow.
                        </Text>
                      </View>
                      <View style={styles.moduleHeaderBadge}>
                        <Text style={styles.moduleHeaderBadgeText}>
                          {String(currentModuleIndex + 1).padStart(2, '0')}/{topChips.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.moduleHeaderActions}>
                      <Pressable style={styles.moduleNavButton} onPress={closeModule}>
                        <Text style={styles.moduleNavButtonText}>Home</Text>
                      </Pressable>
                      <Pressable style={styles.moduleNavButton} onPress={goToPreviousModule}>
                        <Text style={styles.moduleNavButtonText}>Previous</Text>
                      </Pressable>
                      <Pressable style={styles.moduleNavButton} onPress={goToNextModule}>
                        <Text style={styles.moduleNavButtonText}>Next</Text>
                      </Pressable>
                    </View>
                  </View>

                  {showAdmissionPanel && (
                    <View style={styles.registerPanel}>
                  <View style={styles.registerHeader}>
                    <Text style={styles.registerTitle}>Admission Details</Text>
                    <Text style={styles.registerSubtitle}>
                      Quick lead capture form from FrontDesk_AdmissionQR
                    </Text>
                  </View>

                  <View style={styles.registerBody}>
                    <View style={styles.formColumn}>
                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Parent Full Name *</Text>
                          <TextInput
                            value={registerForm.full_name}
                            onChangeText={(value) => handleRegisterField('full_name', value)}
                            placeholder="Enter full name"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Occupation</Text>
                          <TextInput
                            value={registerForm.occupation}
                            onChangeText={(value) => handleRegisterField('occupation', value)}
                            placeholder="Enter occupation"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Mobile Number *</Text>
                          <TextInput
                            value={registerForm.mobile_number}
                            onChangeText={(value) => handleRegisterField('mobile_number', value)}
                            placeholder="Mobile number"
                            keyboardType="number-pad"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Email Id</Text>
                          <TextInput
                            value={registerForm.email_id}
                            onChangeText={(value) => handleRegisterField('email_id', value)}
                            placeholder="Email address"
                            keyboardType="email-address"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.inputGroup, styles.fullWidthGroup]}>
                          <Text style={styles.inputLabel}>Address</Text>
                          <TextInput
                            value={registerForm.address}
                            onChangeText={(value) => handleRegisterField('address', value)}
                            placeholder="Enter address"
                            placeholderTextColor="#A0A0A0"
                            style={[styles.textInput, styles.multilineInput]}
                            multiline
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Student Name *</Text>
                          <TextInput
                            value={registerForm.student_name}
                            onChangeText={(value) => handleRegisterField('student_name', value)}
                            placeholder="Student name"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Admission *</Text>
                          <TextInput
                            value={registerForm.lead_admission_for}
                            onChangeText={(value) =>
                              handleRegisterField('lead_admission_for', value)
                            }
                            placeholder="Lead admission for"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Date Of Birth (DOB) *</Text>
                          <TextInput
                            value={registerForm.dob}
                            onChangeText={(value) => handleRegisterField('dob', value)}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Interest Status</Text>
                          <TextInput
                            value={registerForm.interest_status}
                            onChangeText={(value) => handleRegisterField('interest_status', value)}
                            placeholder={interestStatusOptions.join(' / ')}
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.inputGroup, styles.fullWidthGroup]}>
                          <Text style={styles.inputLabel}>Refer By</Text>
                          <TextInput
                            value={registerForm.refer_by}
                            onChangeText={(value) => handleRegisterField('refer_by', value)}
                            placeholder="Select campaign user"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      {referByOptions.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.pillRow}
                        >
                          {referByOptions.map((option) => {
                            const active =
                              normalizeComparableText(registerForm.refer_by) ===
                              normalizeComparableText(option);

                            return (
                              <Pressable
                                key={option}
                                onPress={() => handleRegisterField('refer_by', option)}
                                style={[styles.pill, active && styles.pillActive]}
                              >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                  {option}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>

                    <View style={styles.cameraColumn}>
                      <Pressable style={styles.photoUploadCard} onPress={handlePhotoPick}>
                        {photo ? (
                          <View style={styles.photoPreview}>
                            <Image source={{ uri: photo.uri }} style={styles.photoPreviewImage} />
                          </View>
                        ) : (
                          <View style={styles.photoCircle}>
                            <Text style={styles.photoCircleText}>+</Text>
                          </View>
                        )}
                        <Text style={styles.photoLabel}>Student&apos;s photo</Text>
                        <Text style={styles.photoHint}>
                          {photo ? 'Tap to replace selected image' : 'Tap here to add an image'}
                        </Text>
                      </Pressable>

                      <View style={styles.registerSummaryCard}>
                        <Text style={styles.summaryTitle}>Live Preview</Text>
                        <Text style={styles.summaryText}>
                          Name: {registerForm.full_name || 'Parent Full Name'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Student: {registerForm.student_name || 'Student Name'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Mobile: {registerForm.mobile_number || 'Mobile Number'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Admission: {registerForm.lead_admission_for || 'Admission'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.registerActions}>
                      <Pressable
                        style={[styles.registerButton, isSubmitting && styles.registerButtonDisabled]}
                        onPress={handleSubmitPress}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.registerButtonText}>Register Lead</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                    </View>
                )}

                  {showEnrollmentPanel && (
                    <View style={styles.registerPanel}>
                  <View style={styles.registerHeader}>
                    <Text style={styles.registerTitle}>Enrollment</Text>
                    <Text style={styles.registerSubtitle}>
                      Same lead-driven enrollment flow used on the desktop screen
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.enrollmentLeadStrip}
                  >
                    {communicationLeads.map((lead) => {
                      const active = String(selectedEnrollmentLead?.id || '') === String(lead.id);
                      return (
                        <Pressable
                          key={String(lead.id)}
                          onPress={() => applyEnrollmentLead(lead)}
                          style={[styles.leadCard, active && styles.leadCardActive]}
                        >
                          <Text style={[styles.leadCardTitle, active && styles.leadCardTitleActive]}>
                            {lead.full_name || lead.student_name || `Lead ${lead.id}`}
                          </Text>
                          <Text style={[styles.leadCardMeta, active && styles.leadCardMetaActive]}>
                            {lead.mobile_number || '-'}
                          </Text>
                          <Text style={[styles.leadCardMeta, active && styles.leadCardMetaActive]}>
                            {lead.lead_admission_for || 'Admission'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.registerBody}>
                    <View style={styles.formColumn}>
                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>First Name *</Text>
                          <TextInput
                            value={enrollmentForm.first_name}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, first_name: value }))
                            }
                            placeholder="First name"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Last Name</Text>
                          <TextInput
                            value={enrollmentForm.last_name}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, last_name: value }))
                            }
                            placeholder="Last name"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Father Name *</Text>
                          <TextInput
                            value={enrollmentForm.father_name}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, father_name: value }))
                            }
                            placeholder="Father name"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Mother Name</Text>
                          <TextInput
                            value={enrollmentForm.mother_name}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, mother_name: value }))
                            }
                            placeholder="Mother name"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Date Of Birth *</Text>
                          <TextInput
                            value={enrollmentForm.dob}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, dob: value }))
                            }
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Blood Group</Text>
                          <TextInput
                            value={enrollmentForm.blood_group}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, blood_group: value }))
                            }
                            placeholder="Blood group"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Admission For *</Text>
                          <TextInput
                            value={enrollmentForm.admission_for}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, admission_for: value }))
                            }
                            placeholder="Admission for"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Branch</Text>
                          <TextInput
                            value={enrollmentForm.branch}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, branch: value }))
                            }
                            placeholder="Branch"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.inputGroup, styles.fullWidthGroup]}>
                          <Text style={styles.inputLabel}>Address *</Text>
                          <TextInput
                            value={enrollmentForm.address}
                            onChangeText={(value) =>
                              setEnrollmentForm((prev) => ({ ...prev, address: value }))
                            }
                            placeholder="Enter address"
                            placeholderTextColor="#A0A0A0"
                            style={[styles.textInput, styles.multilineInput]}
                            multiline
                          />
                        </View>
                      </View>

                      <View style={styles.enrollmentDocsSection}>
                        <Text style={styles.enrollmentDocsTitle}>Supporting Documents</Text>
                        <View style={styles.enrollmentDocsGrid}>
                          {(Object.keys(enrollmentDocumentLabels) as EnrollmentDocumentKey[]).map(
                            (key) => {
                              const pickedFile = enrollmentDocs[key];

                              return (
                                <Pressable
                                  key={key}
                                  onPress={() => handleEnrollmentDocumentPick(key)}
                                  style={styles.enrollmentDocButton}
                                >
                                  <Text style={styles.enrollmentDocButtonLabel}>
                                    {enrollmentDocumentLabels[key]}
                                  </Text>
                                  <Text style={styles.enrollmentDocButtonHint}>
                                    {pickedFile ? pickedFile.name : 'Tap to attach'}
                                  </Text>
                                </Pressable>
                              );
                            }
                          )}
                        </View>
                      </View>

                      <View style={styles.registerActions}>
                        <Pressable
                          style={[
                            styles.registerButton,
                            isEnrollmentSubmitting && styles.registerButtonDisabled,
                          ]}
                          onPress={submitEnrollment}
                          disabled={isEnrollmentSubmitting}
                        >
                          {isEnrollmentSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.registerButtonText}>Submit Enrollment</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>

                      <View style={styles.cameraColumn}>
                      <View style={styles.registerSummaryCard}>
                        <Text style={styles.summaryTitle}>Selected Lead</Text>
                        <Text style={styles.summaryText}>
                          Name:{' '}
                          {selectedEnrollmentLead?.full_name ||
                            selectedEnrollmentLead?.student_name ||
                            'Select a lead'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Class: {selectedEnrollmentLead?.lead_admission_for || '-'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Mobile: {selectedEnrollmentLead?.mobile_number || '-'}
                        </Text>
                        <Text style={styles.summaryText}>
                          This uses the same `/enrollment` and `/api/create-login` endpoints.
                        </Text>
                      </View>

                      <View style={styles.registerSummaryCard}>
                        <Text style={styles.summaryTitle}>Docs Status</Text>
                        <Text style={styles.summaryText}>
                          TC: {enrollmentDocs.tc_document ? enrollmentDocs.tc_document.name : 'Not selected'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Father ID: {enrollmentDocs.father_id ? enrollmentDocs.father_id.name : 'Not selected'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Aadhar: {enrollmentDocs.aadhar_document ? enrollmentDocs.aadhar_document.name : 'Not selected'}
                        </Text>
                      </View>
                    </View>
                  </View>
                    </View>
                )}

                  {showCommunicationPanel && (
                    <View style={styles.registerPanel}>
                  <View style={styles.registerHeader}>
                    <Text style={styles.registerTitle}>Communication</Text>
                    <Text style={styles.registerSubtitle}>
                      Same timeline-based communication flow from the desktop screen
                    </Text>
                  </View>

                  <View style={styles.communicationToolbar}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Date Filter</Text>
                      <TextInput
                        value={communicationDateFilter}
                        onChangeText={setCommunicationDateFilter}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#A0A0A0"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timelineStrip}
                  >
                    {communicationLeads
                      .filter((lead) => {
                        if (!communicationDateFilter) return true;
                        return formatDateCell(lead.date) === communicationDateFilter;
                      })
                      .map((lead) => {
                        const active = String(selectedCommunicationLead?.id || '') === String(lead.id);
                        return (
                          <Pressable
                            key={String(lead.id)}
                            onPress={() => applyCommunicationLead(lead)}
                            style={[styles.timelineCard, active && styles.timelineCardActive]}
                          >
                            <Text
                              style={[styles.timelineCardDate, active && styles.timelineCardDateActive]}
                            >
                              {formatDateCell(lead.date)}
                            </Text>
                            <Text
                              style={[styles.timelineCardName, active && styles.timelineCardNameActive]}
                            >
                              {lead.full_name || lead.student_name || `Lead ${lead.id}`}
                            </Text>
                            <Text
                              style={[styles.timelineCardMeta, active && styles.timelineCardMetaActive]}
                            >
                              {lead.mobile_number || '-'}
                            </Text>
                            <Text
                              style={[styles.timelineCardMeta, active && styles.timelineCardMetaActive]}
                            >
                              {lead.lead_admission_for || '-'}
                            </Text>
                          </Pressable>
                        );
                      })}
                  </ScrollView>

                  <View style={styles.registerBody}>
                    <View style={styles.formColumn}>
                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Communication Date *</Text>
                          <TextInput
                            value={communicationForm.comm_date}
                            onChangeText={(value) =>
                              setCommunicationForm((prev) => ({ ...prev, comm_date: value }))
                            }
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Communication Time *</Text>
                          <TextInput
                            value={communicationForm.comm_time}
                            onChangeText={(value) =>
                              setCommunicationForm((prev) => ({ ...prev, comm_time: value }))
                            }
                            placeholder="HH:MM"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.inputGroup, styles.fullWidthGroup]}>
                          <Text style={styles.inputLabel}>Lead *</Text>
                          <Text style={styles.summaryText}>
                            {selectedCommunicationLead?.full_name ||
                              selectedCommunicationLead?.student_name ||
                              'Select a lead from the timeline above'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.inputGroup, styles.fullWidthGroup]}>
                          <Text style={styles.inputLabel}>Channels *</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.pillRow}
                          >
                            {['All', 'WhatsApp', 'Mail', 'SMS'].map((channel) => {
                              const active = communicationForm.channels.includes(channel);
                              return (
                                <Pressable
                                  key={channel}
                                  onPress={() => toggleCommunicationChannel(channel)}
                                  style={[styles.pill, active && styles.pillActive]}
                                >
                                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                                    {channel}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.inputGroup, styles.fullWidthGroup]}>
                          <Text style={styles.inputLabel}>Message *</Text>
                          <TextInput
                            value={communicationForm.message}
                            onChangeText={(value) =>
                              setCommunicationForm((prev) => ({ ...prev, message: value }))
                            }
                            placeholder="Your message"
                            placeholderTextColor="#A0A0A0"
                            style={[styles.textInput, styles.multilineInput]}
                            multiline
                          />
                        </View>
                      </View>

                      <View style={styles.registerActions}>
                        <Pressable
                          style={[
                            styles.registerButton,
                            isCommunicationSubmitting && styles.registerButtonDisabled,
                          ]}
                          onPress={submitCommunication}
                          disabled={isCommunicationSubmitting}
                        >
                          {isCommunicationSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.registerButtonText}>Schedule Messages</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.cameraColumn}>
                      <View style={styles.registerSummaryCard}>
                        <Text style={styles.summaryTitle}>Lead Preview</Text>
                        <Text style={styles.summaryText}>
                          {selectedCommunicationLead
                            ? `${selectedCommunicationLead.full_name || selectedCommunicationLead.student_name}`
                            : 'Select a lead to preview details.'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Channels: {communicationForm.channels.join(', ') || 'None'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Messages are sent through `/api/schedule-messages`.
                        </Text>
                        <Text style={styles.summaryText}>
                          Schedule: {communicationForm.comm_date} at {communicationForm.comm_time}
                        </Text>
                      </View>
                    </View>
                  </View>
                    </View>
                )}

                  {showTestPanel && (
                    <View style={styles.registerPanel}>
                  <View style={styles.registerHeader}>
                    <Text style={styles.registerTitle}>Test & Counselling</Text>
                    <Text style={styles.registerSubtitle}>
                      Same staff assignment flow from the desktop screen
                    </Text>
                  </View>

                  <View style={styles.tabStrip}>
                    {(['Test', 'Counselling'] as const).map((tab) => {
                      const active = testPanelTab === tab;
                      return (
                        <Pressable
                          key={tab}
                          onPress={() => setTestPanelTab(tab)}
                          style={[styles.tabChip, active && styles.tabChipActive]}
                        >
                          <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                            {tab}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timelineStrip}
                  >
                    {testLeads.map((lead) => {
                      const active = String(selectedTestLead?.id || '') === String(lead.id);
                      return (
                        <Pressable
                          key={String(lead.id)}
                          onPress={() => applyTestLead(lead)}
                          style={[styles.timelineCard, active && styles.timelineCardActive]}
                        >
                          <Text
                            style={[styles.timelineCardName, active && styles.timelineCardNameActive]}
                          >
                            {lead.full_name || lead.student_name || `Lead ${lead.id}`}
                          </Text>
                          <Text
                            style={[styles.timelineCardMeta, active && styles.timelineCardMetaActive]}
                          >
                            {lead.mobile_number || '-'}
                          </Text>
                          <Text
                            style={[styles.timelineCardMeta, active && styles.timelineCardMetaActive]}
                          >
                            {lead.lead_admission_for || '-'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.registerBody}>
                    <View style={styles.formColumn}>
                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Test Date *</Text>
                          <TextInput
                            value={testForm.test_date}
                            onChangeText={(value) =>
                              setTestForm((prev) => ({ ...prev, test_date: value }))
                            }
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Test Time *</Text>
                          <TextInput
                            value={testForm.test_time}
                            onChangeText={(value) =>
                              setTestForm((prev) => ({ ...prev, test_time: value }))
                            }
                            placeholder="HH:MM"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Lead *</Text>
                          <Text style={styles.summaryText}>
                            {selectedTestLead?.full_name ||
                              selectedTestLead?.student_name ||
                              'Select a lead from the strip above'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Teacher *</Text>
                          <View style={styles.teacherGrid}>
                            {availableTeachers.map((teacher) => {
                              const active = String(teacher.teacher_id) === testForm.teacher_id;
                              return (
                                <Pressable
                                  key={String(teacher.teacher_id)}
                                  onPress={() =>
                                    setTestForm((prev) => ({
                                      ...prev,
                                      teacher_id: String(teacher.teacher_id),
                                    }))
                                  }
                                  style={[styles.teacherCard, active && styles.teacherCardActive]}
                                >
                                  <Text
                                    style={[styles.teacherCardName, active && styles.teacherCardNameActive]}
                                  >
                                    {teacher.teacher_name}
                                  </Text>
                                  <Text
                                    style={[styles.teacherCardMeta, active && styles.teacherCardMetaActive]}
                                  >
                                    {teacher.subject || teacher.designation || teacher.phone_no || '-'}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Test Mode</Text>
                          <TextInput
                            value={testForm.test_mode}
                            onChangeText={(value) =>
                              setTestForm((prev) => ({ ...prev, test_mode: value }))
                            }
                            placeholder="Offline / Online"
                            placeholderTextColor="#A0A0A0"
                            style={styles.textInput}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Counselling Required</Text>
                          <Pressable
                            onPress={() =>
                              setTestForm((prev) => ({
                                ...prev,
                                counselling_required: !prev.counselling_required,
                              }))
                            }
                            style={[
                              styles.pill,
                              testForm.counselling_required && styles.pillActive,
                              styles.counsellingToggle,
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillText,
                                testForm.counselling_required && styles.pillTextActive,
                              ]}
                            >
                              {testForm.counselling_required ? 'Yes' : 'No'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      {testForm.counselling_required && (
                        <View style={styles.formRow}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Counselling Date *</Text>
                            <TextInput
                              value={testForm.counselling_date}
                              onChangeText={(value) =>
                                setTestForm((prev) => ({ ...prev, counselling_date: value }))
                              }
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor="#A0A0A0"
                              style={styles.textInput}
                            />
                          </View>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Counselling Time *</Text>
                            <TextInput
                              value={testForm.counselling_time}
                              onChangeText={(value) =>
                                setTestForm((prev) => ({ ...prev, counselling_time: value }))
                              }
                              placeholder="HH:MM"
                              placeholderTextColor="#A0A0A0"
                              style={styles.textInput}
                            />
                          </View>
                        </View>
                      )}

                      <View style={styles.registerActions}>
                        <Pressable
                          style={[styles.registerButton, isTestSubmitting && styles.registerButtonDisabled]}
                          onPress={submitTestCounselling}
                          disabled={isTestSubmitting}
                        >
                          {isTestSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.registerButtonText}>Save Assignment</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.cameraColumn}>
                      <View style={styles.registerSummaryCard}>
                        <Text style={styles.summaryTitle}>Assignment Preview</Text>
                        <Text style={styles.summaryText}>
                          Lead:{' '}
                          {selectedTestLead?.full_name ||
                            selectedTestLead?.student_name ||
                            'Select a lead'}
                        </Text>
                        <Text style={styles.summaryText}>
                          Teacher:{' '}
                          {availableTeachers.find((item) => String(item.teacher_id) === testForm.teacher_id)
                            ?.teacher_name || 'Select a teacher'}
                        </Text>
                        <Text style={styles.summaryText}>
                          This calls `/api/api/add-lead` with `ASSIGN_TEACHER`.
                        </Text>
                        <Text style={styles.summaryText}>
                          Test: {testForm.test_date} at {testForm.test_time}
                        </Text>
                        {panelLoading && <Text style={styles.summaryText}>Loading available data...</Text>}
                      </View>
                  </View>
                    </View>
                  </View>
                )}

                  {showReportPanel && (
                    <View style={styles.registerPanel}>
                  <View style={styles.registerHeader}>
                    <Text style={styles.registerTitle}>Reports</Text>
                    <Text style={styles.registerSubtitle}>
                      Same report source as frontDeskReport.tsx
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.reportCardRow}
                  >
                    {reportCards.map((card) => {
                      const active = activeReportType === card.reportType;
                      return (
                        <Pressable
                          key={`${card.title}-${card.subtitle}`}
                          onPress={() => setActiveReportType(card.reportType)}
                          style={[styles.reportMiniCard, active && styles.reportMiniCardActive]}
                        >
                          <View style={styles.reportMiniIconWrap}>
                            {renderIcon(card.kind, card.icon, active ? '#FFFFFF' : '#5A5A5A', 22)}
                          </View>
                          <Text style={[styles.reportMiniTitle, active && styles.reportMiniTitleActive]}>
                            {card.title}
                          </Text>
                          <Text
                            style={[
                              styles.reportMiniSubtitle,
                              active && styles.reportMiniSubtitleActive,
                            ]}
                          >
                            {card.subtitle}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.formRow}>
                    <View style={[styles.inputGroup, styles.fullWidthGroup]}>
                      <Text style={styles.inputLabel}>Search</Text>
                      <TextInput
                        value={reportSearch}
                        onChangeText={setReportSearch}
                        placeholder="Search name / mobile / email / lead name"
                        placeholderTextColor="#A0A0A0"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  {reportLoading && <Text style={styles.summaryText}>Loading report data...</Text>}
                  {!reportLoading && reportError ? (
                    <Text style={styles.summaryText}>{reportError}</Text>
                  ) : null}
                  {!reportLoading && !reportError && reportVisibleRows.length === 0 ? (
                    <Text style={styles.summaryText}>No data found.</Text>
                  ) : null}

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.reportTable}>
                      <View style={styles.reportTableHeader}>
                        {reportTableColumns.map((column) => (
                          <Text key={column} style={styles.reportTableHeaderCell}>
                            {column}
                          </Text>
                        ))}
                      </View>

                      {reportVisibleRows.map((row) => (
                        <View key={String(row.id)} style={styles.reportTableRow}>
                          {activeReportType === 'timeline' ? (
                            <>
                              <Text style={styles.reportTableCell}>{row.id}</Text>
                              <Text style={styles.reportTableCell}>{row.full_name || '-'}</Text>
                              <Text style={styles.reportTableCell}>{row.lead_admission_for || '-'}</Text>
                              <Text style={styles.reportTableCell}>{row.mobile_number || '-'}</Text>
                              <Text style={styles.reportTableCell}>
                                {row.assigned_teacher_name || '-'}
                              </Text>
                              <Text style={styles.reportTableCell}>{formatDateCell(row.test_date)}</Text>
                              <Text style={styles.reportTableCell}>{formatTimeCell(row.test_time)}</Text>
                              <Text style={styles.reportTableCell}>{formatDateCell(row.counselling_date)}</Text>
                              <Text style={styles.reportTableCell}>{formatTimeCell(row.counselling_time)}</Text>
                            </>
                          ) : activeReportType === 'enrolled' ? (
                            <>
                              <Text style={styles.reportTableCell}>{row.id}</Text>
                              <Text style={styles.reportTableCell}>{row.full_name || '-'}</Text>
                              <Text style={styles.reportTableCell}>{row.lead_admission_for || '-'}</Text>
                              <Text style={styles.reportTableCell}>{row.mobile_number || '-'}</Text>
                              <Text style={styles.reportTableCell}>{row.reg_no || '-'}</Text>
                              <Text style={styles.reportTableCell}>
                                {row.assigned_teacher_name || '-'}
                              </Text>
                              <Text style={styles.reportTableCell}>
                                {isTruthyStatus(row.enrolled) ? 'Yes' : 'No'}
                              </Text>
                              <Text style={styles.reportTableCell}>{Number(row.admission_paid || 0)}</Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.reportTableCell}>{row.id}</Text>
                              <Text style={styles.reportTableCell}>{row.full_name || '-'}</Text>
                              <Text style={styles.reportTableCell}>
                                {activeReportType === 'staff' ? row.refer_by || '-' : row.lead_name || '-'}
                              </Text>
                              <Text style={styles.reportTableCell}>{row.mobile_number || '-'}</Text>
                              <Text style={styles.reportTableCell}>{row.email_id || '-'}</Text>
                              <Text style={styles.reportTableCell}>{row.reg_no || '-'}</Text>
                              {activeReportType !== 'digital' && (
                                <Text style={styles.reportTableCell}>
                                  {activeReportType === 'staff' ? row.lead_name || '-' : row.assigned_teacher_name || '-'}
                                </Text>
                              )}
                              {activeReportType !== 'digital' && (
                                <Text style={styles.reportTableCell}>{row.entry_type || '-'}</Text>
                              )}
                              <Text style={styles.reportTableCell}>{formatDateCell(row.date)}</Text>
                              <Text style={styles.reportTableCell}>{formatTimeCell(row.lead_time)}</Text>
                            </>
                          )}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                )}
                </>
                )}

              {!moduleOpen && (
                <>
                  <View style={styles.heroCard}>
                    <View style={styles.heroGlow} />
                    <Image source={heroImage} style={styles.heroImage} resizeMode="contain" />
                  </View>

                  <Text style={styles.sectionTitle}>Dashboard</Text>

                  <View style={styles.grid}>
                    {dashboardTiles.map((tile) => (
                      <Pressable
                        key={tile.label}
                        onPress={() => openModule(tile.chipLabel || selectedChip)}
                        style={styles.gridCard}
                      >
                        <View style={styles.gridIconWrap}>
                          {renderIcon(tile.kind, tile.icon, '#7F7F84', 26)}
                        </View>
                        <Text style={styles.gridLabel}>{tile.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Campaigning Status</Text>

                  <View style={styles.statusCardsRow}>
                    {campaignCards.map((card, index) => (
                      <View
                        key={card.subtitle}
                        style={[
                          styles.statusCard,
                          index === 0 ? styles.statusCardLeft : styles.statusCardRight,
                          { backgroundColor: card.background },
                        ]}
                      >
                        <View style={styles.statusCardText}>
                          <View style={styles.statusTitleRow}>
                            <Text style={styles.statusNumber}>{card.title}</Text>
                            <Text style={styles.statusSubtitle}>{card.subtitle}</Text>
                          </View>
                          <Text style={styles.statusFooter}>{card.footer}</Text>
                        </View>

                        <View style={styles.statusIconWrap}>
                          {renderIcon(card.kind, card.icon, '#4C4C4C', 30)}
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}

            </ScrollView>

            {showDuplicateConfirm && (
              <View style={styles.overlay}>
                <View style={styles.popupCard}>
                  <Text style={styles.popupTitle}>Duplicate Lead</Text>
                  <Text style={styles.popupMessage}>
                    You already have submitted this lead. Do you want to submit it again?
                  </Text>
                  <View style={styles.popupActions}>
                    <Pressable
                      style={[styles.popupButton, styles.popupButtonSecondary]}
                      onPress={() => {
                        setShowDuplicateConfirm(false);
                        setShowPopup(false);
                      }}
                    >
                      <Text style={[styles.popupButtonText, styles.popupButtonTextSecondary]}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.popupButton, styles.popupButtonPrimary]}
                      onPress={async () => {
                        setShowDuplicateConfirm(false);
                        await submitLead(true);
                      }}
                    >
                      <Text style={styles.popupButtonText}>Submit Again</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {showPopup && !showDuplicateConfirm && (
              <View style={styles.overlay}>
                <View style={styles.popupCard}>
                  <Text style={styles.popupTitle}>{popupTitle}</Text>
                  <Text style={styles.popupMessage}>{popupMessage}</Text>
                  <View style={styles.popupActions}>
                    <Pressable
                      style={[styles.popupButton, styles.popupButtonPrimary]}
                      onPress={() => {
                        setShowPopup(false);
                        setPopupMessage('');
                      }}
                    >
                      <Text style={styles.popupButtonText}>OK</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.poweredBy}>Powered By</Text>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            </View>

            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default DashboardScreen;
