import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { createAppStyles } from '../App.styles';
import { RootStackParamList } from '../types';
import ParentAcademic from './ParentAcademic';
import ParentHomework from './ParentHomwork';
import ParentFees from './ParentFees';
import ParentTimetable from './ParentTimetable';
import ParentCalender from './ParentCalender';
import ParentPhotos from './ParentPhotos';
import ParentLiveChatTicket from './ParentLiveChatTicket';
import ParentHomepage from './parentEvents';

const ParentHomeworkView = ParentHomework as unknown as React.ComponentType<any>;
const ParentAcademicView = ParentAcademic as unknown as React.ComponentType<any>;
const ParentFeesView = ParentFees as unknown as React.ComponentType<any>;
const ParentTimetableView = ParentTimetable as unknown as React.ComponentType<any>;
const ParentCalenderView = ParentCalender as unknown as React.ComponentType<any>;
const ParentPhotosView = ParentPhotos as unknown as React.ComponentType<any>;
const ParentLiveChatTicketView = ParentLiveChatTicket as unknown as React.ComponentType<any>;
const ParentHomepageView = ParentHomepage as unknown as React.ComponentType<any>;

type IconKind = 'material' | 'fontawesome';
type ParentModuleRoute =
  | 'AcademicSummary'
  | 'FeesSummary'
  | 'ParentAcademic'
  | 'ParentFees'
  | 'ParentHomework'
  | 'ParentTimetable'
  | 'ParentCalender'
  | 'ParentPhotos'
  | 'ParentLiveChatTicket'
  | 'ParentHomepage';

type ParentTile = {
  label: string;
  icon: string;
  kind: IconKind;
  route: ParentModuleRoute;
  component: React.ComponentType<any>;
};

type ParentChild = {
  id: number | string;
  name?: string;
  username?: string;
  father_name?: string;
  phone_no?: string;
  class_name?: string;
  section?: string;
  photoUrl?: string;
  schoolCode?: string;
  aadhar_no?: string;
  address?: string;
  class_teacher?: string;
  gender?: string;
  school_name?: string;
};

const heroImage: ImageSourcePropType = require('../assets/dashboard.png');
const logoImage: ImageSourcePropType = require('../assets/Cleezo.png');
const backArrowImage: ImageSourcePropType = require('../assets/Arrow.png');

const normalizeInstituteLogo = (rawLogo: any) => {
  if (!rawLogo) return '';

  let logo = rawLogo;

  if (typeof logo === 'object' && logo?.type === 'Buffer' && Array.isArray(logo?.data)) {
    try {
      const bytes = new Uint8Array(logo.data);
      const bufferCtor = (globalThis as any).Buffer;
      const bufferBase64 = bufferCtor ? bufferCtor.from(bytes).toString('base64') : '';
      return bufferBase64 ? `data:image/png;base64,${bufferBase64}` : '';
    } catch {
      return '';
    }
  }

  if (typeof logo !== 'string') return '';
  logo = logo.trim();
  if (!logo) return '';
  if (logo.startsWith('data:image')) return logo;
  if (logo.startsWith('http')) return logo;

  if (logo.startsWith('uploads/')) {
    return `https://cleezoclass.com:4000/${logo}`;
  }

  if (logo.startsWith('/uploads/')) {
    return `https://cleezoclass.com:4000${logo}`;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
    return `data:image/png;base64,${logo}`;
  }

  return '';
};

const topChips = ['Overview', 'Learning', 'Support', 'Events'];

const parentTiles: ParentTile[] = [
  {
    label: 'Academic',
    icon: 'school',
    kind: 'material',
    route: 'ParentAcademic',
    component: ParentAcademic,
  },
  {
    label: 'Homework',
    icon: 'assignment',
    kind: 'material',
    route: 'ParentHomework',
    component: ParentHomework,
  },
  {
    label: 'Fees',
    icon: 'payments',
    kind: 'material',
    route: 'ParentFees',
    component: ParentFees,
  },
  {
    label: 'Timetable',
    icon: 'schedule',
    kind: 'material',
    route: 'ParentTimetable',
    component: ParentTimetable,
  },
  {
    label: 'Calendar',
    icon: 'event',
    kind: 'material',
    route: 'ParentCalender',
    component: ParentCalender,
  },
  {
    label: 'Photos',
    icon: 'photo-library',
    kind: 'material',
    route: 'ParentPhotos',
    component: ParentPhotos,
  },
  {
    label: 'Chat & Tickets',
    icon: 'chat',
    kind: 'material',
    route: 'ParentLiveChatTicket',
    component: ParentLiveChatTicket,
  },
  {
    label: 'Announcements',
    icon: 'photo-library',
    kind: 'material',
    route: 'ParentHomepage',
    component: ParentHomepage,
  },
];

const renderIcon = (kind: IconKind, name: string, color: string, size: number) => {
  if (kind === 'fontawesome') {
    return <FontAwesome name={name} size={size} color={color} />;
  }

  return <MaterialIcons name={name} size={size} color={color} />;
};

const computeAcademicSummary = (performance: any[], testTypes: any[]) => {
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

  const getLegacyMarkForRow = (subj: any, rowKey: string) => {
    const match = String(rowKey || '').toUpperCase().match(/^(FA|SA)(\d+)$/);
    if (!match) return { mark: '-', max: 0 };

    const type = match[1];
    const index = Number(match[2]) - 1;
    const mark = type === 'FA' ? subj?.FA?.[index] : subj?.SA?.[index];
    const max = type === 'FA' ? 20 : 80;

    return { mark: mark ?? '-', max: mark === null || mark === undefined ? 0 : max };
  };

  const getMarkForRow = (subj: any, row: any) => {
    const testEntry = subj?.tests?.[row?.key];
    if (testEntry?.obtained !== null && testEntry?.obtained !== undefined) {
      return testEntry.obtained;
    }
    return getLegacyMarkForRow(subj, row?.key).mark;
  };

  const getMaxForRow = (subj: any, row: any) => {
    const testEntry = subj?.tests?.[row?.key];
    if (testEntry?.max !== null && testEntry?.max !== undefined) {
      return Number(testEntry.max) || 0;
    }
    return getLegacyMarkForRow(subj, row?.key).max;
  };

  let obtained = 0;
  let total = 0;

  performance.forEach((subj) => {
    termRows.forEach((row) => {
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

const ParentDashboard = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedChip, setSelectedChip] = useState<(typeof topChips)[number]>('Overview');
  const [selectedModule, setSelectedModule] = useState<ParentModuleRoute>('ParentAcademic');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState<Record<string, any> | null>(null);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [studentData, setStudentData] = useState<Record<string, any> | null>(null);
  const [teacherProfileCache, setTeacherProfileCache] = useState<Record<string, any> | null>(null);
  const [loginName, setLoginName] = useState('Parent');
  const [schoolLogo, setSchoolLogo] = useState<string>('');
  const [academicSummary, setAcademicSummary] = useState({ grade: '-', percentage: '0.00' });
  const [feeSummary, setFeeSummary] = useState({ paid: '₹ 0.00', due: '₹ 0.00' });
  const scrollRef = useRef<ScrollView | null>(null);
  const sectionPositions = useRef<Partial<Record<ParentModuleRoute, number>>>({});
  const { width, height } = useWindowDimensions();
  const phoneWidth = Math.min(Math.max(width - 24, 320), 390);
  const phoneHeight = Math.min(Math.max(height - 24, 720), 860);
  const styles = createAppStyles({ phoneWidth, phoneHeight });
  const normalizeText = (value: any) =>
    String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizePhone = (value: any) => String(value ?? '').replace(/\D/g, '');

  const cacheTeacherProfile = async (profile: Record<string, any> | null) => {
    if (!profile) return;
    try {
      await AsyncStorage.setItem('teacherProfile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to cache teacher profile:', error);
    }
  };

  const loadStudentData = async () => {
    try {
      const currentStudentRaw = await AsyncStorage.getItem('currentStudent');
      let currentStudent = null;
      if (currentStudentRaw) {
        try {
          currentStudent = JSON.parse(currentStudentRaw);
        } catch (parseError) {
          console.warn('Failed to parse currentStudent, falling back to stored keys only:', parseError);
        }
      }

      const keys = ['studentId', 'name', 'class_name', 'section', 'schoolCode', 'username', 'parentName'];
      const stores = await AsyncStorage.multiGet(keys);
      const data: Record<string, any> = {};
      stores.forEach(([key, value]) => {
        if (value) data[key] = value;
      });

      const merged = {
        ...(currentStudent || {}),
        ...data,
      };

      if (merged.studentId && !merged.id) merged.id = merged.studentId;
      if (merged.id && !merged.studentId) merged.studentId = merged.id;

      setStudentData(merged);
      setLoginName((current) => {
        if (current !== 'Parent') return current;
        return String(data.parentName || data.name || merged.name || current);
      });
      return merged;
    } catch (error) {
      console.error('Failed to load parent student data:', error);
      return null;
    }
  };

  const loadStudentProfile = async () => {
    try {
      setProfileLoading(true);
      const [username, schoolCode] = await Promise.all([
        AsyncStorage.getItem('username'),
        AsyncStorage.getItem('schoolCode'),
      ]);

      if (!username || !schoolCode) {
        setStudentProfile(null);
        return null;
      }

      const response = await fetch(
        `http://162.215.210.38:3010/api/student/profile?username=${encodeURIComponent(username)}&schoolCode=${encodeURIComponent(schoolCode)}`
      );
      const json = await response.json().catch(() => null);

      if (response.ok && json?.success && json?.student) {
        setStudentProfile(json.student);
        await AsyncStorage.setItem('parentProfile', JSON.stringify(json.student));
        return json.student;
      }

      const fallbackProfile = {
        username,
        schoolCode,
        name: (await AsyncStorage.getItem('name')) || 'Parent',
      };
      setStudentProfile(fallbackProfile);
      await AsyncStorage.setItem('parentProfile', JSON.stringify(fallbackProfile));
      return fallbackProfile;
    } catch (error) {
      console.error('Failed to load parent profile:', error);
      setStudentProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const loadChildren = async (profileLike?: Record<string, any> | null) => {
    try {
      setChildrenLoading(true);
      const base = profileLike || {};
      const username = String(base.username || (await AsyncStorage.getItem('username')) || '');
      const schoolCode = String(base.schoolCode || (await AsyncStorage.getItem('schoolCode')) || '');

      if (!username || !schoolCode) {
        setChildren([]);
        return [] as ParentChild[];
      }

      const profileRes = await axios.get('http://162.215.210.38:3010/api/student/profile', {
        params: { username, schoolCode },
      });

      if (!profileRes.data.success || !profileRes.data.student) {
        setChildren([]);
        return [] as ParentChild[];
      }

      const baseStudent = profileRes.data.student;
      const siblingsRes = await axios.post('http://162.215.210.38:3010/api/student/siblings', {
        username,
        schoolCode,
        father_name: baseStudent.father_name,
        phone_no: baseStudent.phone_no,
      });

      if (siblingsRes.data.success && Array.isArray(siblingsRes.data.siblings)) {
        setChildren(siblingsRes.data.siblings);
        return siblingsRes.data.siblings;
      }

      setChildren([]);
      return [] as ParentChild[];
    } catch (error) {
      console.error('Failed to load parent children:', error);
      setChildren([]);
      return [] as ParentChild[];
    } finally {
      setChildrenLoading(false);
    }
  };

  const loadSummaries = async (profileLike?: Record<string, any> | null, dataLike?: Record<string, any> | null) => {
    const activeStudent = {
      ...(profileLike || {}),
      ...(dataLike || {}),
    };

    if (
      !activeStudent?.name ||
      !activeStudent?.class_name ||
      !activeStudent?.section ||
      !activeStudent?.schoolCode
    ) {
      return;
    }

    try {
      const studentId =
        activeStudent?.studentId ||
        activeStudent?.id ||
        (await AsyncStorage.getItem('studentId')) ||
        '';

      const [academicRes, feeRes] = await Promise.all([
        axios.post('https://cleezoclass.com:4000/api/overall/academic-performance', {
          name: activeStudent.name,
          class_name: activeStudent.class_name,
          section: activeStudent.section,
          schoolCode: activeStudent.schoolCode,
        }),
        axios.post('https://cleezoclass.com:4000/api/studentFees', {
          studentId,
          schoolCode: activeStudent.schoolCode,
        }),
      ]);

      const academicData = academicRes.data;
      const performance = Array.isArray(academicData)
        ? academicData
        : Array.isArray(academicData?.performance)
        ? academicData.performance
        : Array.isArray(academicData?.data)
        ? academicData.data
        : [];
      const testTypes = Array.isArray(academicData?.testTypes) ? academicData.testTypes : [];
      setAcademicSummary(computeAcademicSummary(performance, testTypes));

      const feeDetails = feeRes.data?.feeDetails || feeRes.data?.feeDetail || {};
      const paidAmount =
        Number(feeDetails.Paid_Amount ?? 0) +
        Number(feeDetails.Admission_paid ?? 0) +
        Number(feeDetails.books_paid ?? 0) +
        Number(feeDetails.uniform_paid ?? 0) +
        Number(feeDetails.bus_paid ?? 0) +
        Number(feeDetails.exam_paid ?? 0) +
        Number(feeDetails.others_paid ?? 0);
      const totalAmount = Number(feeDetails.Final_Amount ?? feeDetails.CompleteFee ?? 0);

      const formatINR = (value: number) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }).format(value);

      setFeeSummary({
        paid: formatINR(paidAmount),
        due: formatINR(totalAmount - paidAmount),
      });
    } catch (error) {
      console.error('Failed to load parent summaries:', error);
    }
  };

  const refreshParentAccount = async () => {
    const data = await loadStudentData();
    const profile = await loadStudentProfile();
    const activeStudent = {
      ...(profile || {}),
      ...(data || {}),
    };

    await Promise.all([loadChildren(activeStudent), loadSummaries(profile, data)]);
  };

  useEffect(() => {
    const loadTeacherProfileCache = async () => {
      try {
        const cachedTeacherProfileRaw = await AsyncStorage.getItem('teacherProfile');
        if (!cachedTeacherProfileRaw) {
          setTeacherProfileCache(null);
          return;
        }

        const cachedTeacherProfile = JSON.parse(cachedTeacherProfileRaw);
        setTeacherProfileCache(cachedTeacherProfile);
      } catch (error) {
        console.error('Failed to load cached teacher profile:', error);
        setTeacherProfileCache(null);
      }
    };

    void loadTeacherProfileCache();
  }, [showProfileModal]);

  useEffect(() => {
    const loadSchoolLogo = async () => {
      try {
        const schoolCode = String(
          studentData?.schoolCode ||
            (await AsyncStorage.getItem('schoolCode')) ||
            ''
        ).trim();

        if (!schoolCode) {
          setSchoolLogo('');
          return;
        }

        const response = await fetch(
          `https://cleezoclass.com:4000/api/institute?dbName=${encodeURIComponent(schoolCode)}`
        );
        const data = await response.json().catch(() => null);
        const normalizedLogo = normalizeInstituteLogo(data?.logo);
        setSchoolLogo(normalizedLogo);
        if (normalizedLogo) {
          await AsyncStorage.setItem('schoolLogo', normalizedLogo);
        }
      } catch (error) {
        console.error('Failed to load school logo:', error);
        const cachedLogo = await AsyncStorage.getItem('schoolLogo');
        setSchoolLogo(cachedLogo || '');
      }
    };

    void loadSchoolLogo();
  }, [studentData?.schoolCode]);

  useEffect(() => {
    void refreshParentAccount();
  }, []);

  const visibleTiles = useMemo(() => {
    switch (selectedChip) {
      case 'Learning':
        return parentTiles.filter(
          (tile) =>
            tile.route === 'ParentAcademic' ||
            tile.route === 'ParentFees' ||
            tile.route === 'ParentHomework' ||
            tile.route === 'ParentTimetable'
        );
      case 'Support':
        return parentTiles.filter((tile) => tile.route === 'ParentLiveChatTicket');
      case 'Events':
        return parentTiles.filter(
          (tile) => tile.route === 'ParentHomepage' || tile.route === 'ParentCalender' || tile.route === 'ParentPhotos'
        );
      default:
        return parentTiles;
    }
  }, [selectedChip]);

  const visibleTileColumns = useMemo(() => {
    return visibleTiles.reduce<ParentTile[][]>((columns, tile, index) => {
      if (index % 2 === 0) {
        columns.push([tile]);
      } else {
        columns[columns.length - 1].push(tile);
      }

      return columns;
    }, []);
  }, [visibleTiles]);

  const selectedChipTiles = useMemo(() => {
    const quickOrder: ParentModuleRoute[] = [
      'ParentAcademic',
      'ParentHomework',
      'ParentFees',
      'ParentTimetable',
      'ParentCalender',
      'ParentPhotos',
      'ParentLiveChatTicket',
      'ParentHomepage',
    ];

    return quickOrder
      .map((route) => parentTiles.find((tile) => tile.route === route))
      .filter((tile): tile is ParentTile => {
        if (!tile) return false;

        switch (selectedChip) {
          case 'Learning':
            return (
              tile.route === 'ParentAcademic' ||
              tile.route === 'ParentFees' ||
              tile.route === 'ParentHomework' ||
              tile.route === 'ParentTimetable'
            );
          case 'Support':
            return tile.route === 'ParentLiveChatTicket';
          case 'Events':
            return (
              tile.route === 'ParentHomepage' ||
              tile.route === 'ParentCalender' ||
              tile.route === 'ParentPhotos'
            );
          default:
            return true;
        }
      });
  }, [selectedChip]);

  const selectedSummary = useMemo(() => {
    switch (selectedChip) {
      case 'Learning':
        return 'Academic progress, fees, homework and timetable live here.';
      case 'Support':
        return 'Open chat and ticket tools for parent communication.';
      case 'Events':
        return 'See calendar events, photos and school announcements.';
      default:
        return 'Everything a parent needs in one launcher.';
    }
  }, [selectedChip]);

  const openModule = (route: ParentModuleRoute) => {
    setSelectedModule(route);
    const y = sectionPositions.current[route];
    if (typeof y === 'number' && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleOpenHomePanel = () => {
    setSelectedChip('Overview');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    setSelectedModule(selectedChipTiles[0]?.route ?? 'ParentHomework');
  }, [selectedChipTiles]);

  const handleAddPress = () => {
    openModule('ParentAcademic');
  };

  const handleTilePress = (route: ParentModuleRoute) => {
    openModule(route);
  };

  const handleOpenChat = () => {
    openModule('ParentLiveChatTicket');
  };

  const handleOpenProfilePanel = () => {
    setShowProfileModal(true);
    void refreshParentAccount();
  };

  const handleSwitchToChild = async (child: ParentChild) => {
    try {
      const existingSchoolCode = await AsyncStorage.getItem('schoolCode');
      const safeSchoolCode = String(child.schoolCode || existingSchoolCode || '');
      const existingUsername = await AsyncStorage.getItem('username');
      const safeUsername = String(child.username || existingUsername || '');
      const existingParentName = await AsyncStorage.getItem('parentName');
      const safeParentName = String(existingParentName || loginName || '');

      await AsyncStorage.multiSet([
        ['studentId', String(child.id || '')],
        ['username', safeUsername],
        ['schoolCode', safeSchoolCode],
        ['parentName', safeParentName],
        ['name', child.name || ''],
        ['class_name', child.class_name || ''],
        ['section', child.section || ''],
        ['photoUrl', child.photoUrl || ''],
        ['aadhar_no', child.aadhar_no || ''],
        ['address', child.address || ''],
        ['class_teacher', child.class_teacher || ''],
        ['father_name', child.father_name || ''],
        ['gender', child.gender || ''],
        ['phone_no', child.phone_no || ''],
        ['school_name', child.school_name || ''],
        ['userType', 'student'],
      ]);
      await AsyncStorage.setItem('currentStudent', JSON.stringify(child));

      setShowProfileModal(false);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'ParentDashboard' as never,
            params: {
              username: safeUsername,
              name: child.name || '',
            } as never,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to switch child:', error);
      Alert.alert('Error', 'Failed to switch to this student.');
    }
  };

  const canSwitchToTeacherAccount = useMemo(() => {
    const currentName = normalizeText(studentProfile?.father_name || studentData?.father_name);
    const currentPhone = normalizePhone(
      studentProfile?.phone_no || studentData?.phone_no || studentData?.mobile || ''
    );
    const teacherName = normalizeText(teacherProfileCache?.name);
    const teacherPhone = normalizePhone(
      teacherProfileCache?.phoneNo ||
        teacherProfileCache?.phone_no ||
        teacherProfileCache?.mobile_number ||
        ''
    );

    return Boolean(
      teacherProfileCache &&
        normalizeText(teacherProfileCache?.userType) === 'teacher' &&
        currentName &&
        currentPhone &&
        currentName === teacherName &&
        currentPhone === teacherPhone
    );
  }, [studentData?.father_name, studentData?.phone_no, studentData?.mobile, studentProfile, teacherProfileCache]);

  const handleSwitchToTeacherAccount = async () => {
    try {
      if (!teacherProfileCache) {
        Alert.alert('Unavailable', 'Teacher account details were not found on this device.');
        return;
      }

      const username = String(teacherProfileCache.username || '');
      const schoolCode = String(teacherProfileCache.schoolCode || '');
      const name = String(teacherProfileCache.name || '');
      const designation = String(teacherProfileCache.designation || '');

      await AsyncStorage.multiSet([
        ['username', username],
        ['name', name],
        ['schoolCode', schoolCode],
        ['designation', designation],
        ['userType', 'teacher'],
        ['userDetails', JSON.stringify(teacherProfileCache)],
        ['lastScreen', 'TeacherAdmissionDashboard'],
      ]);
      await cacheTeacherProfile(teacherProfileCache);

      setShowProfileModal(false);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'TeacherAdmissionDashboard' as never,
            params: { username, name },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to switch to teacher account:', error);
      Alert.alert('Error', 'Failed to switch to teacher account.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              'username',
              'userType',
              'name',
              'schoolCode',
              'designation',
              'lastScreen',
              'studentId',
              'activeChildId',
              'activeChildName',
              'activeChildClass',
              'activeChildSection',
              'activeRole',
              'activeUserType',
              'currentChildData',
              'fcmToken',
            ]);
          } catch (error) {
            console.error('Failed to clear parent session:', error);
          } finally {
            setShowProfileModal(false);
            navigation.reset({
              index: 0,
              routes: [{ name: 'TeacherLogin' }],
            });
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E0F" />

      <View style={styles.background}>
        <View style={styles.phoneShell}>
          <View style={styles.phoneFrame}>
            <View style={styles.toolbar}>
              <View style={styles.toolbarBrand}>
                <Image
                  source={schoolLogo ? { uri: schoolLogo } : logoImage}
                  style={styles.toolbarBrandLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.toolbarCenterAbsolute}>
                <Text style={styles.toolbarBrandName} numberOfLines={1}>
                 Welcome {loginName}
                </Text>
              </View>
              <View style={styles.toolbarSpacer} />
              <Pressable style={styles.toolbarButton} onPress={() => openModule('ParentLiveChatTicket')}>
                <FontAwesome name="bell" size={18} color="#F4F4F4" />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              stickyHeaderIndices={[0]}
              showsVerticalScrollIndicator={false}
            >
              {/* <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {topChips.map((chip, index) => {
                  const active = chip === selectedChip;

                  return (
                    <Pressable
                      key={chip}
                      onPress={() => setSelectedChip(chip)}
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
              </ScrollView> */}

              <View style={[styles.chipStickyHeader, styles.chipRowSection]}>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  directionalLockEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedChipMapRow}
                >
                  {selectedChipTiles.map((tile, index) => {
                    const active = selectedModule === tile.route;

                    return (
                      <Pressable
                        key={tile.route}
                        onPress={() => openModule(tile.route)}
                        style={[
                          styles.selectedChipMapItem,
                          index !== selectedChipTiles.length - 1 &&
                            styles.selectedChipMapItemSpacing,
                          active ? styles.selectedChipMapItemActive : styles.selectedChipMapItemInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectedChipMapText,
                            active
                              ? styles.selectedChipMapTextActive
                              : styles.selectedChipMapTextInactive,
                          ]}
                        >
                          {tile.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.heroCard}>
                <View style={styles.heroGlow} />
                <Image source={heroImage} style={styles.heroImage} resizeMode="contain" />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={styles.sectionTitle}>Parent Dashboard</Text>
                <Text style={{ color: '#68686D', fontSize: 13, marginTop: -6, marginBottom: 8 }}>
                  {selectedSummary}
                </Text>
              </View>

              <ScrollView
                horizontal
                nestedScrollEnabled
                directionalLockEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.dashboardGridScrollArea}
                contentContainerStyle={styles.dashboardGridScroller}
              >
                {visibleTileColumns.map((column, columnIndex) => (
                  <View
                    key={`parent-grid-column-${columnIndex}`}
                    style={[
                      styles.dashboardGridColumn,
                      columnIndex !== visibleTileColumns.length - 1 &&
                        styles.dashboardGridColumnSpacing,
                    ]}
                  >
                    {column.map((tile) => (
                      <Pressable
                        key={tile.route}
                        style={[
                          styles.dashboardGridCard,
                          selectedModule === tile.route && styles.dashboardGridCardActive,
                        ]}
                        onPress={() => handleTilePress(tile.route)}
                      >
                        <View style={styles.gridIconWrap}>
                          {renderIcon(tile.kind, tile.icon, '#7F7F84', 26)}
                        </View>
                        <Text style={styles.gridLabel}>{tile.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </ScrollView>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: Math.max(phoneHeight * 0.24, 180) }}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                <View style={styles.statusCardsRow}>
                  <View
                    style={[
                      styles.statusCard,
                      styles.statusCardLeft,
                      { backgroundColor: '#D7E8C9' },
                    ]}
                    onLayout={(event) => {
                      sectionPositions.current.ParentAcademic = event.nativeEvent.layout.y;
                    }}
                  >
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      style={styles.statusCardTextScroll}
                      contentContainerStyle={styles.statusCardTextScrollContent}
                    >
                      <View style={styles.statusTitleRow}>
                        <Text style={styles.statusNumber} numberOfLines={1} ellipsizeMode="tail">
                          Academic
                        </Text>
                        <Text style={styles.statusSubtitle} numberOfLines={1} ellipsizeMode="tail">
                          {academicSummary.grade}
                        </Text>
                      </View>
                      <Text style={styles.statusFooter} numberOfLines={1} ellipsizeMode="tail">
                        {academicSummary.percentage}%
                      </Text>
                      <Pressable
                        onPress={() => openModule('ParentAcademic')}
                        style={styles.statusActionButton}
                      >
                        <Text style={styles.statusActionLink}>Open Academic</Text>
                      </Pressable>
                    </ScrollView>
                    <View style={styles.statusIconWrap}>
                      <MaterialIcons name="school" size={30} color="#4C4C4C" />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusCard,
                      styles.statusCardRight,
                      { backgroundColor: '#F2EE9E' },
                    ]}
                    onLayout={(event) => {
                      sectionPositions.current.ParentFees = event.nativeEvent.layout.y;
                    }}
                  >
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    style={styles.statusCardTextScroll}
                    contentContainerStyle={styles.statusCardTextScrollContent}
                  >
                    <View style={styles.statusTitleRow}>
                      <Text style={styles.statusNumber} numberOfLines={1} ellipsizeMode="tail">
                        Fees
                      </Text>
                      <Text style={styles.statusSubtitle} numberOfLines={1} ellipsizeMode="tail">
                        Summary
                      </Text>
                    </View>
                    <Text style={styles.statusFooter} numberOfLines={1} ellipsizeMode="tail">
                      {feeSummary.due}
                    </Text>
                    <Pressable
                      onPress={() => openModule('ParentFees')}
                      style={styles.statusActionButton}
                    >
                      <Text style={styles.statusActionLink}>Open Fees</Text>
                    </Pressable>
                  </ScrollView>
                  <View style={styles.statusIconWrap}>
                    <MaterialIcons name="payments" size={30} color="#4C4C4C" />
                  </View>
                  </View>
                </View>
              </ScrollView>


              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentAcademic = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Academic</Text>
                      <Text style={styles.moduleHeaderSubtitle}>
                        Student marks, grades and performance.
                      </Text>
                    </View>
                   
                  </View>
                </View>
                <ParentAcademicView embedded />
              </View>

              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentFees = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Fees</Text>
                      <Text style={styles.moduleHeaderSubtitle}>
                        Fee totals, breakdown and installments.
                      </Text>
                    </View>
                   
                  </View>
                </View>
                <ParentFeesView embedded />
              </View>

              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentHomework = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Homework</Text>
                      
                    </View>
                 
                  </View>
                </View>
                <ParentHomeworkView embedded />
              </View>

              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentTimetable = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Timetable</Text>
                      <Text style={styles.moduleHeaderSubtitle}>
                        Daily class routine and periods.
                      </Text>
                    </View>
                    
                  </View>
                </View>
                <ParentTimetableView embedded />
              </View>

              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentCalender = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Calendar</Text>
                      <Text style={styles.moduleHeaderSubtitle}>
                        Events, holidays and school timeline.
                      </Text>
                    </View>
                  
                  </View>
                </View>
                <ParentCalenderView embedded />
              </View>

              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentPhotos = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Photos</Text>
                      <Text style={styles.moduleHeaderSubtitle}>
                        Gallery and school media updates.
                      </Text>
                    </View>
                  
                  </View>
                </View>
                <ParentPhotosView embedded />
              </View>

              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentLiveChatTicket = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Chat & Tickets</Text>
                      <Text style={styles.moduleHeaderSubtitle}>
                        Messages and support requests.
                      </Text>
                    </View>
                   
                  </View>
                </View>
                <ParentLiveChatTicketView embedded />
              </View>
{/* 
              <View
                onLayout={(event) => {
                  sectionPositions.current.ParentHomepage = event.nativeEvent.layout.y;
                }}
              >
                <View style={styles.moduleHeaderCard}>
                  <View style={styles.moduleHeaderTopRow}>
                    <View style={styles.moduleHeaderTextBlock}>
                      <Text style={styles.moduleHeaderTitle}>Announcements</Text>
                      <Text style={styles.moduleHeaderSubtitle}>
                        School notices and highlights.
                      </Text>
                    </View>
                    <View style={styles.moduleHeaderBadge}>
                      <Text style={styles.moduleHeaderBadgeText}>AN</Text>
                    </View>
                  </View>
                </View>
                <ParentHomepageView />
              </View> */}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.footerNav}>
                <Pressable style={styles.footerNavItem} onPress={handleGoBack}>
                  <Image source={backArrowImage} style={{ width: 22, height: 22 }} resizeMode="contain" />
                  <Text style={styles.footerNavLabel}>Back</Text>
                </Pressable>
                <Pressable style={styles.footerNavItem} onPress={handleOpenHomePanel}>
                  <MaterialIcons name="home" size={22} color="#1F1F22" />
                  <Text style={styles.footerNavLabel}>Home</Text>
                </Pressable>
                <Pressable style={styles.footerAddButton} onPress={handleAddPress}>
                  <MaterialIcons name="add" size={26} color="#FFFFFF" />
                </Pressable>
                <Pressable style={styles.footerNavItem} onPress={handleOpenChat}>
                  <MaterialIcons name="chat-bubble-outline" size={22} color="#C2C2C7" />
                  <Text style={styles.footerNavLabelMuted}>Chat</Text>
                </Pressable>
                <Pressable style={styles.footerNavItem} onPress={handleOpenProfilePanel}>
                  <MaterialIcons name="person-outline" size={22} color="#C2C2C7" />
                  <Text style={styles.footerNavLabelMuted}>Profile</Text>
                </Pressable>
              </View>

              <View style={styles.footerBrandRow}>
                <Text style={styles.poweredBy}>Powered By</Text>
                <Image source={logoImage} style={styles.logo} resizeMode="contain" />
              </View>

              <View style={styles.homeIndicator} />
            </View>
          </View>
        </View>
      </View>
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.teacherPopupCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 2 }}
            >
              <View style={styles.teacherHeaderRow}>
                <View style={styles.teacherAvatar}>
                  {studentProfile?.photoUrl ? (
                    <Image
                      source={{ uri: studentProfile.photoUrl }}
                      style={{ width: '100%', height: '100%', borderRadius: 26 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.teacherAvatarText}>
                      {(studentProfile?.name || studentProfile?.username || 'P')
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.teacherHeaderText}>
                  <Text style={styles.teacherTitle}>Parent Profile</Text>
                  <Text style={styles.teacherSubtitle}>
                    {studentProfile?.name || 'Parent profile'}
                  </Text>
                </View>
              </View>

              {profileLoading ? (
                <ActivityIndicator size="large" color="#000" style={{ marginVertical: 24 }} />
              ) : (
                <>
                  <View style={styles.teacherDetailsList}>
                    <View style={styles.teacherDetailRow}>
                      <Text style={styles.teacherDetailLabel}>Father Name</Text>
                      <Text style={styles.teacherDetailValue}>
                        {studentProfile?.father_name || '-'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.teacherDetailsList, { marginBottom: 8 }]}>
                    <Text style={styles.teacherTitle}>Switch Student</Text>
                    <Text style={styles.teacherSubtitle}>
                      Tap a student below to switch the active profile.
                    </Text>

                    {childrenLoading ? (
                      <ActivityIndicator size="small" color="#000" style={{ marginVertical: 16 }} />
                    ) : children.length > 0 ? (
                      children.map((child, index) => {
                        const isActive =
                          String(child.id) === String(studentData?.studentId || studentProfile?.studentId || '');

                        return (
                          <Pressable
                            key={child.id || index}
                            onPress={() => handleSwitchToChild(child)}
                            style={[
                              styles.teacherDetailRow,
                              {
                                backgroundColor: isActive ? '#EEF4FF' : '#F7F8FA',
                                borderColor: isActive ? '#B7C9FF' : '#ECEEF3',
                              },
                            ]}
                          >
                            <Text style={styles.teacherDetailLabel}>
                              {child.name || `Student ${index + 1}`}
                            </Text>
                            <Text style={styles.teacherDetailValue}>
                              Class {child.class_name || '-'} - Section {child.section || '-'}
                            </Text>
                            <Text style={[styles.teacherDetailValue, { marginTop: 4, fontSize: 12 }]}>
                              {child.username ? `Username: ${child.username}` : 'Tap to switch'}
                            </Text>
                          </Pressable>
                        );
                      })
                    ) : (
                      <Text style={{ color: '#666', fontStyle: 'italic', marginTop: 8 }}>
                        No additional students found for this parent account.
                      </Text>
                    )}
                  </View>

                  {canSwitchToTeacherAccount && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={styles.teacherTitle}>Switch Account</Text>
                      <Text style={styles.teacherSubtitle}>
                        A matching teacher account was found on this device.
                      </Text>
                      <Pressable
                        style={[
                          styles.popupButton,
                          styles.popupButtonPrimary,
                          styles.teacherActionButton,
                          { marginTop: 12 },
                        ]}
                        onPress={handleSwitchToTeacherAccount}
                      >
                        <Text style={styles.popupButtonText}>Switch to Teacher Account</Text>
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.teacherActions}>
                    <Pressable
                      style={[styles.popupButton, styles.popupButtonSecondary, styles.teacherActionButton]}
                      onPress={() => setShowProfileModal(false)}
                    >
                      <Text style={[styles.popupButtonText, styles.popupButtonTextSecondary]}>
                        Close
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.popupButton, styles.popupButtonPrimary, styles.teacherActionButton]}
                      onPress={handleLogout}
                    >
                      <Text style={styles.popupButtonText}>Logout</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ParentDashboard;
