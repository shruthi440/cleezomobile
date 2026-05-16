import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  ImageBackground,
  Modal,
  Pressable,
  Animated,Alert,Linking
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TeacherHeader from './TeacherHeader';
import Footer from './Footer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import FooterLogo from './Footerlogo';
import { useNextClass } from './NextClassContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NextClassCard from './NextClassCaard';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import axios from 'axios';
import notifee from '@notifee/react-native';

type HorizontalScrollProps = {
  children: React.ReactNode;
  scrollRef: React.RefObject<ScrollView | null>;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scaleFont = (size: number) => (SCREEN_WIDTH / 375) * size;

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherDashboard'>;
type SummaryBox =
  | { type: 'class'; heading: string; className: string; time: string }
  | { type: 'topic'; heading: string; topic: string; exam: string }
  | { type: 'action'; heading: string; label: string; buttonText: string };

const summaryBoxes: SummaryBox[] = [
  { type: 'class', heading: 'Attendance', className: 'Class 6B', time: '10:00 AM' },
  { type: 'topic', heading: 'Topic of Day', topic: 'Algebra', exam: 'FA2' },
  { type: 'action', heading: 'Homework', label: 'Maths', buttonText: 'Select' },
  { type: 'class', heading: 'Time Table', className: 'Class 7A', time: '11:30 AM' },
  { type: 'topic', heading: 'Today Topic', topic: 'Photosynthesis', exam: 'FA1' },
  { type: 'action', heading: 'Test', label: 'Science', buttonText: 'Start' },
  { type: 'class', heading: 'Behaviour', className: 'Class 8C', time: '09:15 AM' },
  { type: 'topic', heading: 'Revision', topic: 'Geometry', exam: 'SA1' },
  { type: 'action', heading: 'Assignment', label: 'English', buttonText: 'Upload' },
  { type: 'class', heading: 'Calendar', className: 'Class 5A', time: '02:00 PM' },
];

/* ---------------- Dedicated Card Component ---------------- */
// Moving animation logic here prevents the "Empty Page" bug on tab switch
const DashboardCard = ({ item, onPress }: { item: any; onPress: (title: string) => void }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      animatedValue.setValue(0);
    }
  }, [isFocused]);

  const handlePress = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => onPress(item.title));
  };

  const cardBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', '#ee4242ff'],
  });

  return (
    <Animated.View style={[styles.smallCard1, { width: SCREEN_WIDTH * 0.75, backgroundColor: cardBackground }]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={handlePress} activeOpacity={1}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <ImageBackground
          source={item.image}
          resizeMode="cover"
          style={[styles.cardImageBg, { width: item.imageWidth, height: item.imageHeight }]}
        />
        <View style={styles.plusIconBadge}>
          <Text style={styles.plusText}>+</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ---------------- Horizontal Scroll Component ---------------- */
const HorizontalScrollWithScrollbar: React.FC<HorizontalScrollProps> = ({
  children,
  scrollRef,
}) => {
  return (
    <View style={styles.hContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hRow}
      >
        {children}
      </ScrollView>
    </View>
  );
};


const TeacherDashboard: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const isScreenFocused = useIsFocused();
  const morningAttendancePromptKeyRef = useRef<string | null>(null);
const { name, username } = route.params; // make sure route has username
  const [activeTab, setActiveTab] = useState<'Daily Routines' | 'Syllabus Routines' | 'requests'>('Daily Routines');
  const [selectedAction, setSelectedAction] = useState<any>(null);
const { nextClass, setNextClass } = useNextClass();
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
const [className, setClassName] = useState<string | null>(null);
const [section, setSection] = useState<string | null>(null);
const [teacherName, setteacherName] = useState<string>('');
const normalizeTime = (time: string) => {
  if (!time) return '';
  return time.slice(0, 5);
};

const timeToMinutes = (time: string) => {
  const clean = normalizeTime(time);
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + m;
};

const getDayPeriods = (dayData: any) => {
  if (!dayData) return [];
  if (Array.isArray(dayData.periods)) return dayData.periods;
  return [
    ...(dayData.periods?.morning || []),
    ...(dayData.periods?.afternoon || []),
    ...(dayData.periods?.evening || []),
    ...(dayData.periods?.night || []),
  ];
};

const findNextClass = (teacherTimetable: any[]) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const todayData = teacherTimetable.find(d => d.day === today);
  const todayPeriods = getDayPeriods(todayData).sort((a: any, b: any) =>
    normalizeTime(a.fromTime).localeCompare(normalizeTime(b.fromTime))
  );

  const upcomingToday = todayPeriods.find(
    (p: any) => timeToMinutes(p.fromTime) > currentMinutes
  );

  if (upcomingToday) {
    return {
      ...upcomingToday,
      fromTime: normalizeTime(upcomingToday.fromTime),
      toTime: normalizeTime(upcomingToday.toTime),
      day: today,
    };
  }

  const todayIndex = daysOrder.indexOf(today);
  for (let i = todayIndex + 1; i < daysOrder.length; i++) {
    const nextDayData = teacherTimetable.find(d => d.day === daysOrder[i]);
    const nextDayPeriods = getDayPeriods(nextDayData).sort((a: any, b: any) =>
      normalizeTime(a.fromTime).localeCompare(normalizeTime(b.fromTime))
    );
    if (nextDayPeriods.length) {
      const firstPeriod = nextDayPeriods[0];
      return {
        ...firstPeriod,
        fromTime: normalizeTime(firstPeriod.fromTime),
        toTime: normalizeTime(firstPeriod.toTime),
        day: daysOrder[i],
      };
    }
  }

  return null;
};


const triggerAttendanceNotification = async (
  username: string,
  schoolCode: string
) => {
  try {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 10) return;

    const lastShown = await AsyncStorage.getItem('lastAttendanceNotification');
    const today = now.toDateString();
    if (lastShown === today) return;

    const url = `http://162.215.210.38:3010/api/teacher-attendance-alert?username=${username}&schoolCode=${schoolCode}`;

    let data;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        return;
      }
      data = await response.json();
    } catch (apiErr) {
      console.error('❌ Failed to fetch or parse API response:', apiErr);
      return;
    }

    if (!data || !data.alert) return;

    // Collect missing info
    const errors: string[] = [];
    const teacherName = data.teacherName || username;

    // Check subject/designation
    if (!data.designation) errors.push(`Teacher subject (designation) missing for ${teacherName}`);

    // Check assigned classes
    const teachesFields = [
      'teaches_to_1','teaches_to_2','teaches_to_3','teaches_to_4','teaches_to_5',
      'teaches_to_6','teaches_to_7','teaches_to_8','teaches_to_9','teaches_to_10'
    ];
    const assignedClasses = teachesFields.filter(field => data[field]);
    if (assignedClasses.length === 0) errors.push(`No classes assigned to ${teacherName}`);

    if (errors.length > 0) {
      // ✅ Show the detailed error in the notification itself
      const errorMessage = errors.join(' | ');
      console.warn(`⚠️ Attendance data issues for ${teacherName}: ${errorMessage}`);

      await notifee.displayNotification({
        title: `⚠️ Attendance Data Issue for ${teacherName}`,
        body: errorMessage, // This is what the user will see in the app
        android: { channelId: 'reminders', importance: 4, pressAction: { id: 'attendance' } },
      });

      // Mark notification as shown
      await AsyncStorage.setItem('lastAttendanceNotification', today);

      return; // Skip normal attendance notification
    }

    // Everything is fine → normal attendance notification
    await notifee.displayNotification({
      title: '📋 Attendance Reminder',
      body: data.message || 'You have pending attendance tasks.',
      android: { channelId: 'reminders', importance: 4, pressAction: { id: 'attendance' } },
    });

    await AsyncStorage.setItem('lastAttendanceNotification', today);

  } catch (err) {
    // Only real runtime errors go here
    console.error();
  }
};
type StudentActionItem = {
  id: string | number;
  requestId: string | number;
  actionType: 'leave' | 'chat' | 'irregular';
  studentName: string;
  description: string;
  status: string;
  actionDate: string | null;
  leaveStartDate?: string | null;
  leaveEndDate?: string | null;
  leaveLetterUrl?: string | null;
};

    const [studentActions, setStudentActions] = useState<StudentActionItem[]>([]);
    const [irregularFetchError, setIrregularFetchError] = useState<string | null>(null);
const formatDate = (dateString) => {
  if (!dateString) return "-";

  // Create a Date object
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return dateString; // fallback to original string

  // Format as DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};


const fetchStudentActions = async () => {
  try {
    setIrregularFetchError(null);
    const storedSchoolCode = await AsyncStorage.getItem("schoolCode");
    if (!storedSchoolCode) return;
    const storedUsername = await AsyncStorage.getItem("username");
    const teacherIdentity = (name || teacherName || storedUsername || username || "").toString().trim().toLowerCase();
    const currentUsername = (storedUsername || username || "").toString().trim().toLowerCase();

    const getFirstArrayResponse = async (urls: string[]) => {
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const parsed = await response.json().catch(() => null);
          if (Array.isArray(parsed)) return parsed;
        } catch (err) {
          console.warn("⚠️ Fetch source failed:", url, err);
        }
      }
      return [];
    };

    // 1) Leave actions
    const leaveData = await getFirstArrayResponse([
      `http://162.215.210.38:3010/api/api/leave/all?schoolCode=${storedSchoolCode}`,
      `http://162.215.210.38:3010/api/api/leave/pending?schoolCode=${storedSchoolCode}`,
      `http://162.215.210.38:3010/api/leave/all?schoolCode=${storedSchoolCode}`,
      `http://162.215.210.38:3010/api/leave/pending?schoolCode=${storedSchoolCode}`,
    ]);

    const studentLeaveActions: StudentActionItem[] = (Array.isArray(leaveData) ? leaveData : []).map((item: any, index: number) => ({
      id: `leave-${item.id ?? `${item.username || "student"}-${index}`}`,
      requestId: item.id ?? `${item.username || "student"}-${index}`,
      actionType: 'leave',
      studentName: item.student_name || "Unknown",
      description: item.reason || "No reason",
      status: (item.status || "pending").toString().toLowerCase(),
      actionDate: item.submitted_at || item.created_at || item.start_date || null,
      leaveStartDate: item.start_date || null,
      leaveEndDate: item.end_date || null,
      leaveLetterUrl: item.leave_letter_url || null,
    }));

    const leaveActions = [...studentLeaveActions];

    // 2) Chat actions (student related)
    let chatActions: StudentActionItem[] = [];
    try {
      const chatData = await getFirstArrayResponse([
        `https://cleezoclass.com:4000/api/chat-requests?schoolCode=${storedSchoolCode}`,
        `http://162.215.210.38:3010/api/chat-requests?schoolCode=${storedSchoolCode}`,
      ]);

      if (Array.isArray(chatData) && chatData.length > 0) {
        const teacherScoped = chatData
          .filter((chat: any) => {
            const hasStudent = !!chat.party2_student;
            const party1Name = (chat.party1_name || "").toString().trim().toLowerCase();
            const party1Id = (chat.party1_id || "").toString().trim().toLowerCase();
            const isTeacherRelated = party1Name === teacherIdentity || party1Id === currentUsername;
            return hasStudent && (teacherIdentity ? isTeacherRelated : true);
          });

        const fallbackStudentOnly = chatData.filter((chat: any) => !!chat.party2_student);
        const finalChatRows = teacherScoped.length > 0 ? teacherScoped : fallbackStudentOnly;

        chatActions = finalChatRows
          .map((chat: any, index: number) => ({
            id: `chat-${chat.id ?? index}`,
            requestId: chat.id ?? index,
            actionType: 'chat',
            studentName: chat.party2_student || "Unknown",
            description: `Class ${chat.party2_class || "-"}-${chat.party2_section || "-"}`,
            status: (chat.status || "pending").toString().toLowerCase(),
            actionDate: chat.scheduled_at || chat.created_at || null,
          }));
      }
    } catch (chatErr) {
      console.warn("⚠️ Chat actions fetch failed:", chatErr);
    }

    // 3) Irregular attendance actions
    let irregularActions: StudentActionItem[] = [];
    try {
      const irregularData = await getFirstArrayResponse([
        `https://cleezoclass.com:4000/api/list-of-irregulars?schoolCode=${storedSchoolCode}`,
        `https://cleezoclass.com:4000/list-of-irregulars?schoolCode=${storedSchoolCode}`,
        `https://cleezoclass.com:4000/api/list-of-irregulars?schoolCode=${storedSchoolCode}`,
      ]);

      if (Array.isArray(irregularData)) {
        const filteredIrregulars = irregularData.filter((row: any) => {
          const leaveType = (row?.leavetype || '').toString().trim().toLowerCase();
          return leaveType === 'informed' || leaveType === 'uninformed';
        });

        irregularActions = filteredIrregulars.map((row: any, index: number) => ({
          id: `irregular-${row.id ?? `${row.username || row.name || 'student'}-${index}`}`,
          requestId: row.id ?? `${row.username || row.name || 'student'}-${index}`,
          actionType: 'irregular',
          studentName: row.name || row.student_name || row.username || 'Unknown',
          description: `Class ${row.class || row.class_name || '-'}-${row.section || '-'} | ${row.leavetype || 'N/A'}`,
          status: (row.leavetype || 'irregular').toString().toLowerCase(),
          actionDate: row.date || row.submission_time || row.created_at || null,
        }));
      }
    } catch (irregularErr) {
      console.warn("⚠️ Irregular actions fetch failed:", irregularErr);
      setIrregularFetchError("Unable to load irregular list.");
    }

    const combined = [...leaveActions, ...chatActions, ...irregularActions];
    combined.sort((a, b) => {
      const aTime = a.actionDate ? new Date(a.actionDate).getTime() : 0;
      const bTime = b.actionDate ? new Date(b.actionDate).getTime() : 0;
      return bTime - aTime;
    });

    setStudentActions(combined);
  } catch (err) {
    console.error("❌ Fetch student actions error:", err);
    setStudentActions([]);
  }
};
useEffect(() => {
  fetchStudentActions();
}, []);
useEffect(() => {
  if (isScreenFocused) {
    fetchStudentActions();
  }
}, [isScreenFocused]);
const triggerHomeworkNotification = async (
  username: string,
  schoolCode: string
) => {
  try {
    const now = new Date();
    const hour = now.getHours();

    if (hour < 18) return;

    const lastShown = await AsyncStorage.getItem('lastHomeworkNotification');
    const today = now.toDateString();
    if (lastShown === today) return;

    const response = await fetch(
      `http://162.215.210.38:3010/api/check-homework/${username}?schoolCode=${schoolCode}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'user-type': 'teacher',
        },
      }
    );

    const data = await response.json();

    if (data.alert) {
      await notifee.displayNotification({
        title: '📘 Homework Reminder',
        body: `${data.alert} — School: ${schoolCode}`,
        android: {
          channelId: 'reminders',
          importance: 4,
          pressAction: { id: 'homework' },
        },
      });

      await AsyncStorage.setItem('lastHomeworkNotification', today);
    }
  } catch (err) {
    console.error('Homework notification error:', err);
  }
};

useEffect(() => {
  if (username && schoolCode) {
    triggerAttendanceNotification(username, schoolCode);
    triggerHomeworkNotification(username, schoolCode);
  }
}, [username, schoolCode]);
useEffect(() => {
  const fetchClassSection = async () => {
    const username = await AsyncStorage.getItem('username');
    const storedSchoolCode = await AsyncStorage.getItem('schoolCode');

    console.log("📜 Request params:", { username, storedSchoolCode });

    if (!username || !storedSchoolCode) return;

    setSchoolCode(storedSchoolCode);

    try {
      const res = await fetch(
        `http://162.215.210.38:3010/api/get-teacher-class-section?username=${username}&schoolCode=${storedSchoolCode}`
      );

      const result = await res.json();
      console.log("🔥 API raw result:", result);

      if (result.success && result.data) {
        const { class_name, section } = result.data;

        console.log("📥 API DATA:", { class_name, section });

        setClassName(class_name?.toString());
        setSection(section);

        await AsyncStorage.setItem('teacherClass', class_name?.toString());
        await AsyncStorage.setItem('teacherSection', section);
      }
    } catch (err) {
      console.error("❌ Fetch failed:", err);
    }
  };

  fetchClassSection();
}, []);

console.log("🧪 Attendance check values:", {
  className,
  section,
  schoolCode,
});
// Run when className, section, schoolCode are ready


const markAllStudentsPresent = async (leaveUsernames: string[] = []) => {
  if (!className || !section || !schoolCode) {
    console.warn("🚫 Attendance blocked: missing data", { className, section, schoolCode });
    return;
  }

  // Check current time
  const now = new Date();
  const currentHour = now.getHours();

  // Stop if after 10:00 AM without showing alert
  if (currentHour >= 11) {
    return; // silently skip
  }

  const today = now.toISOString().split('T')[0];

  try {
    const response = await fetch(
      'http://162.215.210.38:3010/api/mark-all-present',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_name: className,
          section,
          date: today,
          schoolCode,
          excludeUsernames: leaveUsernames,
        }),
      }
    );

    const result = await response.json();
    if (result.success) {
      Alert.alert("✅ Success", "Attendance updated successfully.");
    } else {
      Alert.alert("❌ Error", result.message);
    }
  } catch (err) {
    console.error('💥 Server Error:', err);
    Alert.alert("❌ Server Error", "Could not mark attendance.");
  }
};

const fetchStudentsOnLeaveForToday = async (today: string) => {
  if (!className || !section || !schoolCode) return [] as Array<{ username: string; student_name: string }>;

  try {
    const response = await fetch(
      `http://162.215.210.38:3010/api/students-on-leave?class_name=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&date=${encodeURIComponent(today)}&schoolCode=${encodeURIComponent(schoolCode)}`
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success || !Array.isArray(data?.data)) return [];
    return data.data;
  } catch (error) {
    console.error('❌ Failed to fetch students-on-leave:', error);
    return [];
  }
};

const runMorningAttendanceFlow = async () => {
  if (!className || !section || !schoolCode) return;

  const now = new Date();
  if (now.getHours() >= 10) return;

  const today = now.toISOString().split('T')[0];
  const promptKey = `${schoolCode}-${className}-${section}-${today}`;
  if (morningAttendancePromptKeyRef.current === promptKey) return;
  morningAttendancePromptKeyRef.current = promptKey;

  const leaveRows = await fetchStudentsOnLeaveForToday(today);
  const leaveUsernames = leaveRows
    .map((row: any) => row?.username)
    .filter((u: any): u is string => typeof u === 'string' && u.length > 0);
  const leaveNames = leaveRows
    .map((row: any) => row?.student_name)
    .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

  const leaveMessage =
    leaveNames.length > 0
      ? `Students on leave today: ${leaveNames.join(', ')}.\nThey will be treated as informed absent.`
      : 'No approved leave requests for today.';

  Alert.alert(
    'Morning Attendance',
    `${leaveMessage}\n\nAny student absent without leave request?`,
    [
      {
        text: 'Yes',
        onPress: () => {
          navigation.navigate('TeacherAttendance', {
            username,
            schoolCode: schoolCode || undefined,
            className: className || undefined,
            section: section || undefined,
            leaveStudents: leaveRows.map((row: any) => ({ username: row?.username })).filter((r: any) => !!r.username),
          } as any);
        },
      },
      {
        text: 'No',
        onPress: () => {
          markAllStudentsPresent(leaveUsernames);
        },
      },
    ],
    { cancelable: false }
  );
};


useEffect(() => {
  if (!className || !section || !schoolCode) return;

  console.log("🧪 Attendance check values (ready):", { className, section, schoolCode });
  runMorningAttendanceFlow();
}, [className, section, schoolCode]);

useEffect(() => {
  loadTeacherTimetable();
}, []);
const loadTeacherTimetable = async () => {
  try {
    const schoolCode = await AsyncStorage.getItem('schoolCode');
    const username = await AsyncStorage.getItem('username');

    if (!schoolCode || !username) return;

    const apiUrl = `http://162.215.210.38:3010/api/teacher-timetable-by-username?username=${username}&schoolCode=${schoolCode}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (Array.isArray(data.teacherTimetable)) {
      const upcoming = findNextClass(data.teacherTimetable);
      console.log('📌 NEXT CLASS (Dashboard):', upcoming);
      setNextClass(upcoming);
    }
  } catch (e) {
    console.error('Failed to load timetable', e);
  }
};
console.log('Navigating to Calendar with=======================:', { username, name });
  const navigateToPage = (title: string) => {
    if (title === 'Attendance') navigation.navigate('TeacherAttendance', {
      username,
      schoolCode: schoolCode || undefined,
      className: className || undefined,
      section: section || undefined,
    } as any);
    else if (title === 'Behaviour') navigation.navigate('TeacherBehaviour');
    else if (title === 'Time Table-\nself view') navigation.navigate('Teachertimetable',{ username, name });
    else if (title === 'Time Table-\nComplete view') navigation.navigate('Teachertimetable',{ username, name });
    else if (title === 'Student \nReport') navigation.navigate('StudentReportcard',{username,name});
    else if (title === 'Calendar') navigation.navigate('TeacherEventCalendar',{ username, name });
    else if (title === 'Syllabus Selection') navigation.navigate('SyllabusSelectionPage');
      else if (title === 'Topic Of \nDay') navigation.navigate('TopicOfDay',{username,name});
    else if (title === 'Homework') navigation.navigate('TeacherHomework',{ username, name });
      else if (title === 'QP Generator') navigation.navigate('TeacherQuestionPaperGeneration',{username,name});
    else if (title === 'Scan & Pull') navigation.navigate('ScanPull',{username, name});
    else if (title === 'Leave \nRequest') navigation.navigate('TeacherLeaveRequest',{username, name});
        else if (title === 'Salary') navigation.navigate('TeacherSalary',{ username, name });
                else if (title === 'Chat \nRequest') navigation.navigate('TeacherChatsAndEvents',{username, name});
                else if (title === 'Test \nRequest') navigation.navigate('TeacherCouncelling',{username, name});
            else if (title === 'Tickets') navigation.navigate('TeacherTicket');

            else if (title === 'Media') navigation.navigate('TeacherEventMediaUpload',{username, name});


  };

  // Define data inside the component so it reacts to state changes
  const dailyData = [
    { title: 'Attendance', image: require('./assets/Attendance.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Behaviour', image: require('./assets/Behaviour.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Time Table-\nself view', image: require('./assets/Timetable1.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Time Table-\nComplete view', image: require('./assets/TimeTable.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Student \nReport', image: require('./assets/studentReports.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Calendar', image: require('./assets/Calender.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },
      { title: 'Salary', image: require('./assets/Salary.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Tickets', image: require('./assets/Ticket.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },
        { title: 'Media', image: require('./assets/Ticket.png'), imageHeight: SCREEN_HEIGHT * 0.295, imageWidth: SCREEN_WIDTH * 0.65 },

  ];
type HorizontalProps = {
  title?: string;
  children: React.ReactNode;
};

  const syllabusData = [
     { title: 'Topic Of \nDay', image: require('./assets/Topicofday.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Homework', image: require('./assets/Home.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'QP Generator', image: require('./assets/QuestionPaper.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },
    { title: 'Scan & Pull', image: require('./assets/ScanAndPull.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },
  ];

  const requestData = [
    { title: 'Leave \nRequest', image: require('./assets/leave.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },
        { title: 'Chat \nRequest', image: require('./assets/chat.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },
        {title:'Test \nRequest', image: require('./assets/chat.png'), imageHeight: SCREEN_HEIGHT * 0.29, imageWidth: SCREEN_WIDTH * 0.65 },

  ];
  const actions = [
    { id: 1, title: 'Leave Letter - 26/12/2025 - K. Chaitanya, 68' },
    { id: 2, title: 'Leave Letter - 27/12/2025 - K. Chaitanya, 68' },
    { id: 3, title: 'Leave Letter - 28/12/2025 - K. Chaitanya, 68' },
    { id: 4, title: 'Leave Letter - 29/12/2025 - K. Chaitanya, 68' },
  ];
  const currentData = activeTab === 'Daily Routines' ? dailyData : activeTab === 'Syllabus Routines' ? syllabusData : requestData;
const HorizontalScrollWithScrollbar1: React.FC<HorizontalProps> = ({ title, children }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(1);
  const [layoutWidth, setLayoutWidth] = useState(SCREEN_WIDTH - 40);

  // We define the width of one "step". 
  // For your actions, it's SCREEN_WIDTH * 0.85 + 10 (margin)
  const ITEM_WIDTH = SCREEN_WIDTH * 0.85 + 10; 

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(e.nativeEvent.contentOffset.x);
  };

  const trackWidth = layoutWidth - 60;
  const thumbWidth = contentWidth > layoutWidth 
    ? (layoutWidth / contentWidth) * trackWidth 
    : trackWidth;

  const maxTranslate = trackWidth - thumbWidth;
  const translateX = contentWidth > layoutWidth
    ? (scrollX / (contentWidth - layoutWidth)) * maxTranslate
    : 0;

  const scrollBy = (direction: 'prev' | 'next') => {
    if (!scrollRef.current) return;
    
    // Calculate current index and move exactly one full item
    const currentIndex = Math.round(scrollX / ITEM_WIDTH);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    scrollRef.current.scrollTo({ 
      x: nextIndex * ITEM_WIDTH, 
      animated: true 
    });
  };


  return (
    <View style={styles.hContainer}>
      {title ? <Text style={styles.hTitle}>{title}</Text> : null}
      
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={w => setContentWidth(w)}
        onLayout={e => setLayoutWidth(e.nativeEvent.layout.width)}
        
        // 🔹 SNAP LOGIC START 🔹
        snapToInterval={ITEM_WIDTH} // The distance between items
        decelerationRate="fast"      // Makes it snap quickly
        snapToAlignment="start"      // Aligns the card to the left
        disableIntervalMomentum={true} // Ensures it only scrolls one item at a time
        // 🔹 SNAP LOGIC END 🔹
      >
        <View style={styles.hRow}>{children}</View>
      </ScrollView>

      {/* Fixed Scrollbar Row */}
      <View style={styles.scrollWrapper}>
        <TouchableOpacity onPress={() => scrollBy('prev')}>
          <Ionicons name="chevron-back" size={10} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.scrollTrack}>
          <View 
            style={[
              styles.scrollThumb, 
              { 
                width: thumbWidth, 
                transform: [{ translateX }],
                backgroundColor: '#000' // Always black for active scrollb
              }
            ]} 
          />
        </View>

        <TouchableOpacity onPress={() => scrollBy('next')}>
          <Ionicons name="chevron-forward" size={10} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const cardScrollRef = useRef<ScrollView>(null);
const summaryScrollRef = useRef<ScrollView>(null);
useEffect(() => {
  cardScrollRef.current?.scrollTo({ x: 0, animated: true });
  summaryScrollRef.current?.scrollTo({ x: 0, animated: true });
}, [activeTab]);
const [modalVisible, setModalVisible] = useState(false);
  const [actionListVisible, setActionListVisible] = useState(false);
  const [irregularPopupVisible, setIrregularPopupVisible] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<'leave' | 'chat' | 'irregular' | null>(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatingActionId, setUpdatingActionId] = useState<string | number | null>(null);

  const syncActionStatus = (itemId: string | number, newStatus: string) => {
    setStudentActions(prev =>
      prev.map(action =>
        action.id === itemId
          ? { ...action, status: newStatus }
          : action
      )
    );
  };

  const updateChatRequestStatus = async (
    requestId: string | number,
    status: 'approved' | 'rejected',
    currentSchoolCode: string
  ) => {
    if (requestId === undefined || requestId === null || requestId === '') {
      throw new Error('Chat request id is missing');
    }

    const attempts: Array<{ url: string; method: 'PATCH' | 'POST' | 'PUT'; body: any }> = [
      {
        url: 'http://162.215.210.38:3010/api/chat-requests/update-status',
        method: 'POST',
        body: { chatId: requestId, status, schoolCode: currentSchoolCode },
      },
      {
        url: `http://162.215.210.38:3010/api/chat-requests/${requestId}/status`,
        method: 'PATCH',
        body: { status, schoolCode: currentSchoolCode },
      },
      {
        url: `https://cleezoclass.com:4000/api/chat-requests/${requestId}/status`,
        method: 'PATCH',
        body: { status, schoolCode: currentSchoolCode },
      },
      {
        url: 'https://cleezoclass.com:4000/api/chat-requests/update-status',
        method: 'POST',
        body: { id: requestId, status, schoolCode: currentSchoolCode },
      },
      {
        url: `https://cleezoclass.com:4000/api/chat-requests/${requestId}`,
        method: 'PUT',
        body: { status, schoolCode: currentSchoolCode },
      },
      {
        url: 'https://cleezoclass.com:4000/api/chat-requests/status',
        method: 'POST',
        body: { id: requestId, status, schoolCode: currentSchoolCode },
      },
      {
        url: 'https://cleezoclass.com:4000/api/chat-requests/status',
        method: 'POST',
        body: { chatId: requestId, status, schoolCode: currentSchoolCode },
      },
      {
        url: 'https://cleezoclass.com:4000/api/chat-requests/update',
        method: 'POST',
        body: { id: requestId, status, schoolCode: currentSchoolCode },
      },
      {
        url: `https://cleezoclass.com:4000/api/chat-requests/update-status/${requestId}`,
        method: 'PUT',
        body: { status, schoolCode: currentSchoolCode },
      },
    ];

    const attemptErrors: string[] = [];

    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt.body),
        });

        if (response.ok) {
          return;
        }

        const errorText = await response.text().catch(() => '');
        attemptErrors.push(`${attempt.method} ${attempt.url} -> ${response.status} ${response.statusText}${errorText ? ` | ${errorText}` : ''}`);
      } catch (error) {
        attemptErrors.push(`${attempt.method} ${attempt.url} -> network/error`);
        console.warn('Chat status update attempt failed:', error);
      }
    }

    throw new Error(`Unable to update chat request status. Tried: ${attemptErrors.join(' || ')}`);
  };

  const updateStudentActionStatus = async (
    item: StudentActionItem,
    status: 'approved' | 'rejected'
  ) => {
    const currentSchoolCode = await AsyncStorage.getItem('schoolCode');
    if (!currentSchoolCode) {
      Alert.alert('Error', 'School code is missing');
      return;
    }

    try {
      setUpdatingActionId(item.id);

      if (item.actionType === 'leave') {
        const response = await fetch('http://162.215.210.38:3010/api/api/leave/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leaveId: item.requestId,
            status,
            schoolCode: currentSchoolCode,
          }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.error || 'Failed to update leave status');
        }
      } else {
        await updateChatRequestStatus(item.requestId, status, currentSchoolCode);
      }

      syncActionStatus(item.id, status);
      Alert.alert('Success', `${item.actionType === 'leave' ? 'Leave' : 'Chat'} request ${status}`);
      fetchStudentActions();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update request');
    } finally {
      setUpdatingActionId(null);
    }
  };

  const reports = [
    { title: 'Performance Syllabus', grade: 'A', percent: '58%' },
    { title: 'Performance Test', grade: 'C+', percent: '68%' },
  ];

  const openModal = (report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const groupedActionCards = useMemo(() => {
    const grouped = studentActions.reduce((acc, action) => {
      if (!acc[action.actionType]) acc[action.actionType] = [];
      acc[action.actionType].push(action);
      return acc;
    }, {} as Record<StudentActionItem['actionType'], StudentActionItem[]>);

    const order: StudentActionItem['actionType'][] = ['leave', 'chat', 'irregular'];
    return order.map(type => {
      const items = grouped[type] || [];
      const latest = items[0] || null;
      return {
        type,
        count: items.length,
        latest,
      };
    });
  }, [studentActions]);

  const selectedActionList = useMemo(() => {
    if (!selectedActionType) return [];
    return studentActions.filter(item => item.actionType === selectedActionType);
  }, [studentActions, selectedActionType]);
  const irregularActionList = useMemo(() => {
    return studentActions.filter(item => item.actionType === 'irregular');
  }, [studentActions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Welcome, {name}</Text>
          <TeacherHeader />
        </View>

        {/* Tab Selection */}
        <View style={{ flexDirection: 'row' }}>
          {['Daily Routines', 'Syllabus Routines', 'Requests'].map((tab) => (
            <TouchableOpacity key={tab} style={{ marginRight: 20 }} onPress={() => setActiveTab(tab as any)}>
              <Text style={{ fontWeight: activeTab === tab ? 'bold' : 'normal', color: activeTab === tab ? '#000' : '#888' }}>
                {tab === 'Daily Routines' ? 'Daily Routines' : tab === 'Syllabus Routines' ? 'Syllabus Routines' : 'Requests'}
              </Text>
              {activeTab === tab && <View style={{ height: 2, backgroundColor: '#000', marginTop: 4 }} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{activeTab} </Text>




         <View style={styles.fixedBoxRow}>
        {reports.map((report, index) => (
          <View key={index} style={styles.smallCard}>
            <Text style={report.title.includes('Syllabus') ? styles.cardTitle : styles.cardTitleBlack}>
              {report.title}
            </Text>
            <Text style={styles.bigGradeBlack}>{report.grade}</Text>
            <Text style={styles.percentTextBlack}>{report.percent}</Text>
            <TouchableOpacity onPress={() => openModal(report)}>
              <Text style={styles.viewLinkBlue}>View Report</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

    <HorizontalScrollWithScrollbar1 title=" ">
  {groupedActionCards.map(({ type, count, latest }) => (
    <TouchableOpacity
      key={type}
      style={{ width: SCREEN_WIDTH * 0.9, marginRight: 10 }}
      onPress={() => {
        setSelectedActionType(type);
        if (type === 'irregular') {
          setIrregularPopupVisible(true);
        } else {
          setActionListVisible(true);
        }
      }}
    >
      <ImageBackground
        source={require('./assets/action.jpeg')}
        style={[styles.actionBg, { padding: 10 }]}
        imageStyle={styles.actionImage}
      >
        {/* Student name + reason */}
        <Text style={[styles.actionText, { marginBottom: 5 }]} numberOfLines={1}>
          {type === 'leave' ? 'Leave Requests' : type === 'chat' ? 'Chat Requests' : 'Irregulars'} - Total: {count}
        </Text>

        {/* Dates */}
     <Text style={{ color: "#fff", marginTop: 5 }}>
  {type === 'leave'
    ? `${formatDate(latest?.leaveStartDate)} → ${formatDate(latest?.leaveEndDate)}`
    : `${latest?.studentName || "Unknown"} - ${latest?.description || "No details"}`} --- {(latest?.status || "pending").toUpperCase()}

</Text>


   
      </ImageBackground>
    </TouchableOpacity>
  ))}
</HorizontalScrollWithScrollbar1>



  <HorizontalScrollWithScrollbar scrollRef={cardScrollRef}>
  {currentData.map((item, index) => (
    <DashboardCard
      key={`${activeTab}-${index}`}
      item={item}
      onPress={navigateToPage}
    />
  ))}
</HorizontalScrollWithScrollbar>

<HorizontalScrollWithScrollbar scrollRef={summaryScrollRef}>
  {summaryBoxes.map((box, index) => (
    <View key={index} style={styles.infoBox}>
      <Text style={styles.boxHeading}>{box.heading}</Text>

      {box.type === 'class' && (
        <>
          <Text style={styles.boxLine}>{box.className}</Text>
          <Text style={styles.boxLine1}>{box.time}</Text>
        </>
      )}

      {box.type === 'topic' && (
        <>
          <Text style={styles.boxLine}>{box.exam}</Text>
          <Text style={styles.boxLine1}>{box.topic}</Text>
        </>
      )}

      {box.type === 'action' && (
        <>
          <Text style={styles.boxLine}>{box.label}</Text>
          <TouchableOpacity style={styles.selectBtn}>
            <Text style={styles.selectBtnText}>{box.buttonText}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  ))}
</HorizontalScrollWithScrollbar>

              <View style={styles.footerWrapper}>
                         <Footer />
                         
        </View> 
      
                         </ScrollView>
                                   <View style={styles.footerWrapper1}>
                         <FooterLogo />
                   <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedReport?.title}</Text>
            <Text style={styles.modalGrade}>Grade: {selectedReport?.grade}</Text>
            <Text style={styles.modalPercent}>Percentage: {selectedReport?.percent}</Text>

            {/* You can add more details here if needed */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>       
      <Modal
        visible={actionListVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionListVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionListModalContent}>
            <Text style={styles.actionListTitle}>
              {selectedActionType === 'leave' ? 'Leave Requests List' : selectedActionType === 'chat' ? 'Chat Requests List' : 'Irregulars List'}
            </Text>
            <ScrollView style={{ width: '100%', maxHeight: hp('45%') }}>
              {selectedActionList.length === 0 ? (
                <Text style={styles.actionListEmpty}>
                  {selectedActionType === 'irregular' && irregularFetchError
                    ? irregularFetchError
                    : 'No actions found.'}
                </Text>
              ) : (
                selectedActionList.map((item) => (
                  <View key={item.id} style={styles.actionListItem}>
                    <Text style={styles.actionListItemText}>
                      {item.studentName} - {item.description}
                    </Text>
                    <Text style={styles.actionListItemSubText}>
                      {item.actionType === 'leave'
                        ? `${formatDate(item.leaveStartDate)} → ${formatDate(item.leaveEndDate)}`
                        : formatDate(item.actionDate)} | {(item.status || 'pending').toUpperCase()}
                    </Text>
                    {item.actionType === 'leave' && item.leaveLetterUrl ? (
                      <TouchableOpacity onPress={() => Linking.openURL(item.leaveLetterUrl)}>
                        <Text style={styles.actionListLink}>Open Leave Letter</Text>
                      </TouchableOpacity>
                    ) : null}
                    {item.actionType !== 'irregular' && (item.status || 'pending') === 'pending' ? (
                      <View style={styles.actionButtonRow}>
                        <TouchableOpacity
                          style={[styles.modalBtn, styles.approveBtnModal, styles.actionModalBtn]}
                          disabled={updatingActionId === item.id}
                          onPress={() => updateStudentActionStatus(item, 'approved')}
                        >
                          <Text style={styles.modalBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalBtn, styles.rejectBtn, styles.actionModalBtn]}
                          disabled={updatingActionId === item.id}
                          onPress={() => updateStudentActionStatus(item, 'rejected')}
                        >
                          <Text style={styles.modalBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setActionListVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={irregularPopupVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIrregularPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionListModalContent}>
            <Text style={styles.actionListTitle}>Irregulars List</Text>
            <ScrollView style={{ width: '100%', maxHeight: hp('45%') }}>
              {irregularActionList.length === 0 ? (
                <Text style={styles.actionListEmpty}>
                  {irregularFetchError || 'No irregulars found.'}
                </Text>
              ) : (
                irregularActionList.map((item) => (
                  <View key={item.id} style={styles.actionListItem}>
                    <Text style={styles.actionListItemText}>
                      {item.studentName} - {item.description}
                    </Text>
                    <Text style={styles.actionListItemSubText}>
                      {formatDate(item.actionDate)} | {(item.status || 'irregular').toUpperCase()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setIrregularPopupVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        </View> 
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerText: { fontSize: scaleFont(18), fontWeight: 'bold', color: '#000' },
  tabItem: { width: 140, marginRight: 10 },
  subHeading: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  activeLine: { marginTop: 4, height: 3, width: '100%', borderRadius: 2 },
  sectionTitle: { fontSize: 24, fontWeight: '300', marginVertical: 10 },
  fixedBoxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  smallCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, width: '48%', borderWidth: 2, borderColor: '#000', elevation: 4 , marginBottom:10},
  cardTitle: { fontSize: scaleFont(12), fontWeight: 'bold', color: '#000' },
  cardTitleBlack: { fontSize: scaleFont(11), fontWeight: 'bold' },
  bigGradeBlack: { fontSize: scaleFont(26), fontWeight: 'bold', textAlign: 'right' },
  percentTextBlack: { fontSize: scaleFont(11), textAlign: 'right' },
  viewLinkBlue: { fontSize: 11, color: '#0a3d62', fontWeight: '600' },
  viewLinkBlack: { fontSize: 12, color: '#000' },
  plusIconBadge: { position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 20, backgroundColor: '#ff6b6b', borderRadius: 20, elevation: 5 },
  plusText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  hContainer: { marginBottom: 20 },
  hRow: { flexDirection: 'row' },
   modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalGrade: { fontSize: 18, marginVertical: 5 },
  modalPercent: { fontSize: 18, marginVertical: 5 },
    closeButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  closeButtonText: { color: '#fff', fontSize: 16 },
  actionListModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  actionListTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#000' },
  actionListEmpty: { textAlign: 'center', color: '#666', marginVertical: 10 },
  actionListItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  actionListItemText: { fontSize: 13, fontWeight: '600', color: '#222' },
  actionListItemSubText: { fontSize: 12, color: '#555', marginTop: 4 },
  actionListLink: { marginTop: 6, color: '#0a3d62', fontWeight: '600', fontSize: 12 },
  scrollWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: -1 },
  scrollTrack: {                
flex: 1, height: 3, backgroundColor: '#ddd', borderRadius: 3, marginHorizontal: 10, overflow: 'hidden' },
  scrollThumb: { height: 3, backgroundColor: '#000', borderRadius: 3 , },
  actionBg: { padding: 16, borderRadius: 12, overflow: 'hidden', width: '100%' },
  actionImage: { borderRadius: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  approveBtn: { backgroundColor: '#404040', paddingVertical: 4, paddingHorizontal: 12,marginRight:17, borderRadius: 20, borderWidth: 1, borderColor: '#FF6B6B' },
  approveText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  infoBox: { backgroundColor: '#fff', borderRadius: 20, padding: 10, width: SCREEN_WIDTH * 0.22, marginRight: 10, borderWidth: 2, borderColor: '#000', alignItems: 'center' },
  boxHeading: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  boxLine: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  boxLine1: { fontSize: 10, color: '#666' },
  selectBtn: { backgroundColor: '#69aff0', paddingHorizontal: 10, borderRadius: 5, marginTop: 5 },
  selectBtnText: { color: '#fff', fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalMessage: { marginVertical: 15, color: '#666' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { width: '45%', padding: 12, borderRadius: 10, alignItems: 'center' },
  actionButtonRow: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  actionModalBtn: { flex: 1, marginHorizontal: 4, width: undefined, paddingVertical: 8 },
  rejectBtn: { backgroundColor: '#e74c3c' },
  approveBtnModal: { backgroundColor: '#2ecc71' },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
    hTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 0},
  cardImageBg: { width: 280,  minHeight: SCREEN_HEIGHT * 0.29, position: 'absolute', right: -12, top: -35 },
  smallCard1: { backgroundColor: '#fff', borderRadius: 20, padding: 12, minHeight: SCREEN_HEIGHT * 0.25, borderWidth: 2, borderColor: '#000', marginRight: 15 },
 footerWrapper: {
    position: 'absolute',
    bottom: -50,   // ✅ 30px from bottom
    left: 0,
    right: 0,
  },
   footerWrapper1: {
   position: 'absolute',
    bottom: hp('-1%'), // 1% from the very bottom of the screen
    left: 0,
    right: 0,
    alignItems: 'center', // Centers children horizontally
    justifyContent: 'center',
    zIndex: 99, // Ensures it stays above all other content
  },
});

export default TeacherDashboard;
