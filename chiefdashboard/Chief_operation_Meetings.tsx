import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  BackHandler,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles as styles } from '../styles';

import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
/* -------------------- TYPES -------------------- */
type MeetingsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Meetings'
>;
interface StudentItem {
  id: number;
  name: string;
  class_name: string;
  section: string;
  schoolCode: string;
  user_type: 'student' | 'teacher';
  class_teacher: string | null;
}

interface AttendanceMonth {
  month: string;
  present: number;
  total: number;
}

interface AttendanceResponse {
  monthly: AttendanceMonth[];
}

interface PerformanceItem {
  subject: string;
  FA: string[];
  SA: string[];
  total: string;
  percentage: string;
  overallGrade: string;
  testGrades: Record<string, unknown>;
}

interface EventSummary {
  total_events: number;
  upcoming_events: number;
  conducted_events: number;
  events_pending_approval: number;
}

interface ChatSummary {
  total_chats: number;
  chats_pending_approval: number;
  chats_accepted: number;
}

interface ChatItem {
  id: number;
  sender_name: string;
  message: string;
  status: 'approved' | 'pending';
  created_at: string;
}

/* -------------------- CONSTANTS -------------------- */
const STATIC_SECTIONS = ['A', 'B', 'C'];
const SCREEN_HEIGHT = Dimensions.get('window').height;

/* -------------------- COMPONENT -------------------- */
const Meetings: React.FC = () => {
  const navigation = useNavigation<MeetingsNavigationProp>();
  const route = useRoute<any>();

  /* ---------- STATE ---------- */
  const [schoolCode, setSchoolCode] = useState<string>('');

  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<StudentItem[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<
    'meetings' | 'events' | 'chats' | null
  >(null);
  const openReportModal = (type: 'meetings' | 'events' | 'chats') => {
    setReportType(type);

    // Set the data depending on type
    switch (type) {
      case 'meetings':
        setReportData({ total: 6 }); // You can fetch real data if needed
        break;
      case 'events':
        setReportData(eventSummary);
        break;
      case 'chats':
        setReportData(chatSummary);
        break;
    }

    setShowReportModal(true);
  };

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [completedEvents, setCompletedEvents] = useState<any[]>([]);
  const [loadingCompletedEvents, setLoadingCompletedEvents] =
    useState<boolean>(false);

  const [chatSummary, setChatSummary] = useState<ChatSummary>({
    total_chats: 0,
    chats_pending_approval: 0,
    chats_accepted: 0,
  });

  const [eventSummary, setEventSummary] = useState<EventSummary>({
    total_events: 0,
    upcoming_events: 0,
    conducted_events: 0,
    events_pending_approval: 0,
  });

  const [overallPerformance] = useState<number>(0);
  const [classTeacher, setClassTeacher] = useState<string>('');

  const [selectedClassSection, setSelectedClassSection] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  /* ---------- REFS (RN SAFE) ---------- */
  const genericPopupContentRef = useRef<View | null>(null);
  const upcomingEventsContentRef = useRef<View | null>(null);
  const completedEventsContentRef = useRef<View | null>(null);
  /* -------------------- ANDROID BACK BUTTON -------------------- */

  /* -------------------- LOAD SCHOOL CODE -------------------- */
  useEffect(() => {
    const loadSchoolCode = async () => {
      const code = await AsyncStorage.getItem('schoolCode');
      if (code) setSchoolCode(code);
    };
    loadSchoolCode();
  }, []);

  /* -------------------- FETCH CLASSES -------------------- */
  useEffect(() => {
    if (!schoolCode) return;

    axios
      .get<string[]>('https://cleezoclass.com:4000/api/classes', {
        params: { schoolCode },
      })
      .then(res => setClasses(res.data ?? []))
      .catch(() => setClasses([]));
  }, [schoolCode]);

  /* -------------------- FETCH STUDENTS -------------------- */
  useEffect(() => {
    if (!selectedClass || !selectedSection || !schoolCode) return;

    axios
      .get<StudentItem[]>('https://cleezoclass.com:4000/api/students', {
        params: {
          schoolCode,
          class: selectedClass,
          section: selectedSection,
        },
      })
      .then(res => {
        const list =
          res.data
            ?.filter(s => s.user_type === 'student')
            .sort((a, b) => a.name.localeCompare(b.name)) || [];

        setStudents(list);
        setSelectedStudentId('');
        setClassTeacher(list[0]?.class_teacher ?? '');
      })
      .catch(() => setStudents([]));
  }, [selectedClass, selectedSection, schoolCode]);

  /* -------------------- FETCH TEACHERS -------------------- */
  useEffect(() => {
    if (!schoolCode) return;

    axios
      .post<StudentItem[]>('https://cleezoclass.com:4000/api/users', {
        schoolCode,
        user_type: 'teacher',
      })
      .then(res => setTeachers(res.data ?? []))
      .catch(() => setTeachers([]));
  }, [schoolCode]);

  /* -------------------- FETCH EVENTS -------------------- */
  const fetchUpcomingEvents = async () => {
    try {
      const res = await axios.get<any[]>(
        'https://cleezoclass.com:4000/api/api/upcoming-events',
        { params: { schoolCode } },
      );
      setUpcomingEvents(res.data ?? []);
      setEventSummary(prev => ({
        ...prev,
        upcoming_events: res.data?.length ?? 0,
      }));
    } catch {}
  };

  const fetchCompletedEvents = async () => {
    setLoadingCompletedEvents(true);
    try {
      const res = await axios.get<any[]>(
        'https://cleezoclass.com:4000/api/api/completed-events',
        { params: { schoolCode } },
      );
      setCompletedEvents(res.data ?? []);
      setEventSummary(prev => ({
        ...prev,
        conducted_events: res.data?.length ?? 0,
      }));
    } catch {
    } finally {
      setLoadingCompletedEvents(false);
    }
  };

  useEffect(() => {
    if (!schoolCode) return;
    fetchUpcomingEvents();
    fetchCompletedEvents();
  }, [schoolCode]);

  /* -------------------- FETCH CHAT SUMMARY -------------------- */
  useEffect(() => {
    if (!schoolCode) return;

    axios
      .get<ChatSummary>('https://cleezoclass.com:4000/api/api/chat-summary', {
        params: { schoolCode },
      })
      .then(res => setChatSummary(res.data))
      .catch(() => {});
  }, [schoolCode]);

  /* -------------------- CLASS & SECTION HANDLER -------------------- */
  const handleClassSectionChange = (value: string) => {
    setSelectedClassSection(value);

    if (!value) {
      setSelectedClass('');
      setSelectedSection('');
      setStudents([]);
      return;
    }

    const [cls, sec] = value.split('-');
    setSelectedClass(cls.trim());
    setSelectedSection(sec.trim());
  };
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i); // last 5 years

  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthYearOptions = YEARS.flatMap(year =>
    MONTHS.map((month, idx) => ({
      label: `${month} ${year}`,
      value: `${year}-${String(idx + 1).padStart(2, '0')}`, // YYYY-MM format
    })),
  );
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );

  /* -------------------- UI -------------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Meetings & Live Chats</Text>
          </View>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.sectionHeading,
                { textDecorationLine: 'underline' },
              ]}
            >
              Chats
            </Text>
            {/* CLASS & STUDENT PICKER */}
            <View style={styles.dropdownRow}>
              <View style={styles.dropdownContainer}>
                <Picker
                  style={styles.picker}
                  itemStyle={{ color: '#111827' }}
                  selectedValue={selectedClassSection}
                  onValueChange={handleClassSectionChange}
                >
                  <Picker.Item label="Select Class - Section" value="" />
                  {classes.flatMap(cls =>
                    STATIC_SECTIONS.map(sec => (
                      <Picker.Item
                        key={`${cls}-${sec}`}
                        label={`Class ${cls} - Section ${sec}`}
                        value={`${cls} - ${sec}`}
                      />
                    )),
                  )}
                </Picker>
              </View>

              <View style={styles.dropdownContainer}>
                <Picker
                  style={styles.picker}
                  itemStyle={{ color: '#111827' }}
                  dropdownIconColor="#fff"
                  selectedValue={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  enabled={students.length > 0}
                >
                  <Picker.Item label="Student" value="" />
                  {students.map(s => (
                    <Picker.Item
                      key={s.id}
                      label={s.name}
                      value={String(s.id)}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          {/* -------------------- TOP 3 CARDS -------------------- */}

          <View style={styles.mainLayout1}>
            {/* Left Column */}
            <View style={styles.leftColumn1}>
              <View style={styles.smallCard1}>
                <Text style={styles.cardTitle}>Chat Requests</Text>
                <Text style={styles.bigGradeBlack}>
                  {chatSummary.total_chats}
                </Text>
                <TouchableOpacity onPress={() => openReportModal('chats')}>
                  <Text style={styles.viewLinkBlue1}>Need Action</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.smallCard1}>
                <Text style={styles.cardTitleBlack}>Chat Informal</Text>
                <Text style={styles.bigGradeBlack}>
                  {chatSummary.chats_accepted}
                </Text>
                <Text style={styles.percentTextBlack}>
                  {chatSummary.total_chats
                    ? (
                        (chatSummary.chats_accepted / chatSummary.total_chats) *
                        100
                      ).toFixed(2)
                    : '0'}
                  %
                </Text>
                <TouchableOpacity onPress={() => openReportModal('chats')}>
                  <Text style={styles.viewLinkBlack1}>Need Action</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.rightColumn1}>
              <View style={styles.combinedCard1}>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: -40 }]}>
                    Festive Greetings
                  </Text>
                  <Text style={styles.bigNum}>0</Text>
                  <TouchableOpacity>
                    <Text style={[styles.viewLinkBlue1, { marginTop: -10 }]}>
                      View List
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: 20 }]}>
                    Photo Share
                  </Text>
                  <Text style={[styles.bigGradeBlack]}>4</Text>
                  <TouchableOpacity>
                    <Text style={styles.viewLink1}>Need Action</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.headerRow, { marginTop: -80 }]}>
            <Text
              style={[
                styles.sectionHeading,
                { textDecorationLine: 'underline' },
              ]}
            >
              Meetings
            </Text>
            <View style={styles.dropdownRow}>
              {/* Month Picker */}
              <View style={styles.dropdownContainer}>
                <Picker
                  style={styles.picker}
                  itemStyle={{ color: '#111827' }}
                  dropdownIconColor="#fff"
                  selectedValue={selectedMonthYear}
                  onValueChange={setSelectedMonthYear}
                >
                  <Picker.Item label="Select Month & Year" value="" />
                  {monthYearOptions.map(item => (
                    <Picker.Item
                      key={item.value}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* -------------------- BOTTOM 3 CARDS -------------------- */}
          <View style={[styles.mainLayout1]}>
            {/* Left Column */}
            <View style={styles.leftColumn1}>
              <View style={styles.smallCard1}>
                <Text style={styles.cardTitle}>Conducted Events</Text>
                <View style={{ alignItems: 'flex-end', marginTop: -10 }}>
                  <Text style={styles.bigGradeBlack}>
                    {completedEvents.length}
                  </Text>
                  <Text style={styles.subText}>as on date</Text>
                </View>
                <TouchableOpacity onPress={() => openReportModal('events')}>
                  <Text style={styles.viewLinkBlue1}>View Report</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.smallCard1]}>
                <Text style={styles.cardTitleBlack}>Meetings</Text>
                <Text style={styles.bigGradeBlack}>
                  {eventSummary.upcoming_events}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.viewLinkBlack1}>Need Action</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.rightColumn1}>
              <View style={styles.combinedCard1}>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: -40 }]}>
                    Festive Greetings
                  </Text>
                  <Text style={styles.bigNum}>0</Text>
                  <TouchableOpacity>
                    <Text style={[styles.viewLinkBlue1, { marginTop: -10 }]}>
                      View List
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: 20 }]}>
                    Upcoming Events
                  </Text>
                  <Text style={styles.bigGradeBlack}>
                    {eventSummary.upcoming_events}
                  </Text>
                  <TouchableOpacity onPress={() => openReportModal('events')}>
                    <Text style={styles.viewLink1}>View List</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <Modal
            visible={showReportModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowReportModal(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: 'white',
                  padding: 20,
                  borderRadius: 20,
                  width: '100%',
                  maxHeight: '80%',
                  borderWidth: 2,
                  borderColor: '#000',
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}
                >
                  {reportType === 'meetings'
                    ? 'Meetings Conducted'
                    : reportType === 'events'
                    ? 'Event Summary'
                    : 'Chat Summary'}
                </Text>

                {reportData && reportType === 'events' && (
                  <>
                    <Text>Total Events: {reportData.total_events}</Text>
                    <Text>Upcoming Events: {reportData.upcoming_events}</Text>
                    <Text>Conducted Events: {reportData.conducted_events}</Text>
                    <Text>
                      Pending Approval: {reportData.events_pending_approval}
                    </Text>
                  </>
                )}

                {reportData && reportType === 'chats' && (
                  <>
                    <Text>Total Chats: {reportData.total_chats}</Text>
                    <Text>
                      Pending Approval: {reportData.chats_pending_approval}
                    </Text>
                    <Text>Accepted: {reportData.chats_accepted}</Text>
                  </>
                )}

                {reportData && reportType === 'meetings' && (
                  <Text>Total Meetings Conducted: {reportData.total}</Text>
                )}

                <TouchableOpacity
                  onPress={() => setShowReportModal(false)}
                  style={{ marginTop: 20, alignSelf: 'flex-end' }}
                >
                  <Text style={{ color: '#0088cc', fontWeight: 'bold' }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Meetings;
