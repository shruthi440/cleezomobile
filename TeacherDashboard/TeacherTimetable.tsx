import React, { useMemo, useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DataTable } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../ThemeContext';
import { globalStyles as styles } from '../teacherStyles';
import {
  timetableStyles as ui,
  attendanceModalStyles as modalStyles,
} from '../teacherStyles';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TeacherTimetableContext } from '../Modalcontext';
import { TouchableWithoutFeedback } from 'react-native';
import { buildTeacherDayPeriods, useNextClass } from '../NextClassContext';

/* ---------------- TYPES & INTERFACES ---------------- */
interface Period {
  fromTime: string;
  toTime: string;
  subject: string;
  class_id?: string;
}

interface TimetablePeriods {
  morning: Period[];
  afternoon: Period[];
  evening: Period[];
  night: Period[];
}

interface TimetableRow {
  day: string;
  morningInterval: string;
  lunchInterval: string;
  afternoonInterval: string;
  eveningInterval: string;
  periods: TimetablePeriods;
}

interface HeaderInfo {
  name: string;
  time: string | null;
}

interface HeaderTimesState {
  intervals: { name: string; time: string | null }[];
  periods: HeaderInfo[];
}

type TeachertimetableRouteProp = RouteProp<RootStackParamList, 'Teachertimetable'>;

type TeachertimetableProps = {
  navigation?: any;
  inlineParams?: {
    username?: string;
    name?: string;
  };
};

const Teachertimetable: React.FC<TeachertimetableProps> = ({ navigation, inlineParams }) => {
  const { themeStyles } = useContext(ThemeContext);
  const placeholderTextColor = themeStyles.inputBorderColor;
  const route = inlineParams
    ? ({ params: inlineParams } as TeachertimetableRouteProp)
    : useRoute<TeachertimetableRouteProp>();
  const [nextClass, setNextClass] = useState<any | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [teacherTimetable, setTeacherTimetable] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'teacher' | 'class'>('teacher');
  const [loading, setLoading] = useState<boolean>(false);
  const [teacherName, setTeacherName] = useState<string>('');
  const [headerTimes, setHeaderTimes] = useState<HeaderTimesState>({
    intervals: [],
    periods: [],
  });
  const [showTeacherTableModal, setShowTeacherTableModal] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [sectionData, setSectionData] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const DAY_COLUMN_WIDTH = 70;
  const COLUMN_WIDTH = 110;
  const TOTAL_WIDTH = DAY_COLUMN_WIDTH + headerTimes.periods.length * COLUMN_WIDTH;

  const getTodayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  const timeToMinutes = (time: string) => {
    const clean = normalizeTime(time);
    const [h, m] = clean.split(':').map(Number);
    return h * 60 + m;
  };

  const normalizeTime = (time: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const findNextClass = (teacherTimetable: any[]) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const today = getTodayName();

    const todayData = teacherTimetable.find(d => d.day === today);
    if (!todayData || !todayData.periods?.length) return null;

    const sortedPeriods = [...todayData.periods].sort(
      (a: any, b: any) => normalizeTime(a.fromTime).localeCompare(normalizeTime(b.fromTime))
    );

    const upcoming = sortedPeriods.find(
      (p: any) => timeToMinutes(p.fromTime) > currentMinutes
    );

    if (!upcoming) {
      const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayIndex = daysOrder.indexOf(today);

      for (let i = todayIndex + 1; i < daysOrder.length; i++) {
        const nextDayData = teacherTimetable.find(d => d.day === daysOrder[i]);
        if (nextDayData?.periods?.length) {
          return {
            ...nextDayData.periods[0],
            fromTime: normalizeTime(nextDayData.periods[0].fromTime),
            toTime: normalizeTime(nextDayData.periods[0].toTime),
            day: daysOrder[i],
          };
        }
      }
      return null;
    }

    return {
      ...upcoming,
      fromTime: normalizeTime(upcoming.fromTime),
      toTime: normalizeTime(upcoming.toTime),
      day: today,
    };
  };

  const buildSchedule = (rows: any[]) => {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndexMap = new Map(daysOrder.map((day, index) => [day, index]));

    return (rows || [])
      .flatMap((row) => {
        const periodList = Array.isArray(row.periods)
          ? row.periods
          : [
              ...(row.periods?.morning || []),
              ...(row.periods?.afternoon || []),
              ...(row.periods?.evening || []),
              ...(row.periods?.night || []),
            ];

        return periodList.map((period: any) => ({
          day: row.day,
          dayIndex: dayIndexMap.get(row.day) ?? 99,
          subject: String(period.subject || '--'),
          classId: String(period.class_id || '--'),
          fromTime: String(period.fromTime || '').slice(0, 5),
          toTime: String(period.toTime || '').slice(0, 5),
          startMinutes: timeToMinutes(String(period.fromTime || '00:00')),
        }));
      })
      .sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.startMinutes - b.startMinutes;
      });
  };

  const { username, name } = route.params || inlineParams || {};
  console.log('📌 Teacher Username:', username);
  console.log('📌 Teacher Name:', name);

  useEffect(() => {
    loadTeacherTimetable();
  }, []);
  const { fullTimetable, refreshNextClass } = useNextClass();
  const [showModal, setShowModal] = useState(false);
  const loadTeacherTimetable = async () => {
    console.log('🔄 loadTeacherTimetable started');
    setLoading(true);

    try {
      console.log('📦 Fetching data from AsyncStorage...');
      const schoolCode = await AsyncStorage.getItem('schoolCode');
      const username = await AsyncStorage.getItem('username');

      console.log('🏫 schoolCode:', schoolCode);
      console.log('👤 username:', username);

      if (!schoolCode || !username) {
        console.warn('⚠️ Missing schoolCode or username, stopping API call');
        setLoading(false);
        return;
      }

      const apiUrl = `http://162.215.210.38:3010/api/teacher-timetable-by-username?username=${username}&schoolCode=${schoolCode}`;
      console.log('🌐 API URL:', apiUrl);

      const response = await fetch(apiUrl);
      console.log('📡 API response status:', response.status);

      const data = await response.json();
      console.log('📥 API response JSON:', data);

      if (data.teacherTimetable && Array.isArray(data.teacherTimetable)) {
        setTeacherTimetable(data.teacherTimetable);
        setTeacherName(data.teacher_name || 'Your Timetable');

        const upcoming = findNextClass(data.teacherTimetable);
        console.log('⏭ Next Class:', upcoming);
        setNextClass(upcoming);

        if (data.teacherTimetable.length > 0) {
          processHeaderTimes(data.teacherTimetable[0]);
        }
      } else {
        console.error('❌ Invalid response format: teacherTimetable is missing or not an array');
      }
    } catch (error) {
      console.error('❌ Error loading teacher timetable:', error);
    } finally {
      console.log('🏁 loadTeacherTimetable finished');
      setLoading(false);
    }
  };

  const processHeaderTimes = (firstRow: TimetableRow) => {
    if (!firstRow) return;
    const allPeriods = [
      ...(firstRow.periods?.morning || []),
      ...(firstRow.periods?.afternoon || []),
      ...(firstRow.periods?.evening || []),
      ...(firstRow.periods?.night || []),
    ].sort((a, b) => a.fromTime.localeCompare(b.fromTime));

    const sortedPeriods = allPeriods.map((period, index) => ({
      name: `Period ${index + 1}`,
      subject: period.subject || 'No subject',
      time: `${period.fromTime} - ${period.toTime}`,
    }));

    const intervals = [
      { name: 'MI', time: firstRow.morningInterval !== 'No Interval' ? firstRow.morningInterval : null },
      { name: 'LI', time: firstRow.lunchInterval !== 'No Interval' ? firstRow.lunchInterval : null },
      { name: 'AI', time: firstRow.afternoonInterval !== 'No Interval' ? firstRow.afternoonInterval : null },
      { name: 'EI', time: firstRow.eveningInterval !== 'No Interval' ? firstRow.eveningInterval : null },
    ].filter(interval => interval.time);

    const mergedHeaderTimes = [...sortedPeriods, ...intervals].sort((a, b) => {
      const timeA = a.time ? a.time.split(' - ')[0] : "";
      const timeB = b.time ? b.time.split(' - ')[0] : "";
      return timeA.localeCompare(timeB);
    });

    setHeaderTimes({ intervals, periods: mergedHeaderTimes });
  };

  const loadClassTimetable = async (classId?: string, sectionId?: string) => {
    const classToLoad = classId || selectedClass;
    const sectionToLoad = sectionId || selectedSection;

    if (!classToLoad || !sectionToLoad) return;

    setLoading(true);
    try {
      const schoolCode = await AsyncStorage.getItem('schoolCode');
      if (!schoolCode) return;
      const response = await fetch(
        `http://162.215.210.38:3010/api/teacher-timetable?class_id=${classToLoad}&section_id=${sectionToLoad}&schoolCode=${schoolCode}`
      );
      const data = await response.json();
      if (data.timetable) {
        setTimetable(data.timetable);
        if (data.timetable.length > 0) processHeaderTimes(data.timetable[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const EMPTY_TIMETABLE: TimetableRow[] = [
    { day: 'Monday', periods: [] },
    { day: 'Tuesday', periods: [] },
    { day: 'Wednesday', periods: [] },
    { day: 'Thursday', periods: [] },
    { day: 'Friday', periods: [] },
    { day: 'Saturday', periods: [] },
  ];

  const renderTimetable = (data: TimetableRow[]) => {
    const isEmpty = !data || data.length === 0;
    const sourceData = isEmpty ? EMPTY_TIMETABLE : data;

    const dayMap: Record<string, TimetableRow> = {};
    sourceData.forEach(item => {
      dayMap[item.day] = item;
    });

    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const uniqueData = daysOrder
      .map(day => dayMap[day])
      .filter(Boolean);

    const formatTime = (time?: string) => {
      if (!time) return '';
      return time.slice(0, 5);
    };

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator
            style={{
              borderWidth: 1,
              borderColor: '#000',
            }}
          >
            <View>
              <View style={[styles.teacherTableHeader, { flexDirection: 'row' }]}>
                <Text style={styles.teacherHeaderCell}>Day</Text>

                {headerTimes.periods.map((p, i) => (
                  <Text key={i} style={styles.teacherHeaderCellMed}>
                    {p.name}
                    {"\n"}
                    <Text style={{ fontSize: 8, color: '#fff' }}>
                      {p.time
                        ? `${formatTime(p.time.split(' - ')[0])} - ${formatTime(p.time.split(' - ')[1])}`
                        : ''}
                    </Text>
                  </Text>
                ))}
              </View>

              {uniqueData.map((dayData, index) => (
                <View
                  key={dayData.day}
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: index === uniqueData.length - 1 ? 0 : 1,
                    borderColor: '#000',
                  }}
                >
                  <Text style={styles.teacherDataCellDay}>
                    {dayData.day}
                  </Text>

                  {headerTimes.periods.map((header, idx) => {
                    const [startTime, endTime] = header.time
                      ? header.time.split(' - ')
                      : ['', ''];

                    const matchedPeriod = [
                      ...(dayData.periods?.morning || []),
                      ...(dayData.periods?.afternoon || []),
                      ...(dayData.periods?.evening || []),
                      ...(dayData.periods?.night || []),
                    ].find(
                      p => p.fromTime === startTime && p.toTime === endTime
                    );

                    const intervalText =
                      dayData.morningInterval !== 'No Interval' &&
                      header.time === dayData.morningInterval
                        ? ' Break 1'
                        : dayData.lunchInterval !== 'No Interval' &&
                          header.time === dayData.lunchInterval
                        ? ' Break 2'
                        : dayData.afternoonInterval !== 'No Interval' &&
                          header.time === dayData.afternoonInterval
                        ? ' Break 3'
                        : dayData.eveningInterval !== 'No Interval' &&
                          header.time === dayData.eveningInterval
                        ? ' Break 4'
                        : null;

                    return (
                      <Text key={idx} style={styles.teacherDataCell}>
                        {intervalText
                          ? intervalText
                          : matchedPeriod
                          ? matchedPeriod.subject
                          : isEmpty
                          ? '--'
                          : '--'}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    );
  };

  const renderTeacherTimetable = (data: any[]) => {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const groupedByDay: any = data.reduce((acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = [];
      }

      if (Array.isArray(item.periods)) {
        acc[item.day].push(...item.periods);
      } else if (item.periods) {
        acc[item.day].push(item.periods);
      }

      return acc;
    }, {});

    const sortedData = daysOrder.map(day => {
      const dayPeriods = groupedByDay[day] || [];

      const uniquePeriods = dayPeriods.filter((v: any, i: number, a: any[]) =>
        a.findIndex(t => t.fromTime === v.fromTime && t.toTime === v.toTime) === i
      );

      return {
        day,
        periods: uniquePeriods.sort((a: any, b: any) => a.fromTime.localeCompare(b.fromTime))
      };
    });

    const maxPeriodsCount = Math.max(...sortedData.map(d => d.periods.length), 1);

    return (
      <ScrollView horizontal style={{ borderWidth: 1, borderColor: '#000' }}>
        <View>
          <View style={[styles.teacherTableHeader, { flexDirection: 'row' }]}>
            <Text style={styles.teacherHeaderCell}>Day</Text>
            {[...Array(maxPeriodsCount)].map((_, i) => (
              <React.Fragment key={i}>
                <Text style={styles.teacherHeaderCellSmall}>Class</Text>
                <Text style={styles.teacherHeaderCellMed}>From</Text>
                <Text style={styles.teacherHeaderCellMed}>To</Text>
              </React.Fragment>
            ))}
          </View>

          {sortedData.map(({ day, periods }) => (
            <View
              key={day}
              style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}
            >
              <Text style={styles.teacherDataCellDay}>{day}</Text>

              {periods.map((p: any, i: number) => (
                <React.Fragment key={i}>
                  <Text style={styles.teacherDataCell}>{p.class_id || '--'}</Text>
                  <Text style={styles.teacherDataCell}>{p.fromTime?.slice(0, 5) || '--'}</Text>
                  <Text style={styles.teacherDataCell}>{p.toTime?.slice(0, 5) || '--'}</Text>
                </React.Fragment>
              ))}

              {[...Array(maxPeriodsCount - periods.length)].map((_, idx) => (
                <React.Fragment key={`empty-${idx}`}>
                  <Text style={styles.teacherDataCell} />
                  <Text style={styles.teacherDataCell} />
                  <Text style={styles.teacherDataCell} />
                </React.Fragment>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // buildTeacherDayPeriods imported from NextClassContext

  /* ---------------- FETCH CLASS & SECTION ---------------- */
  useEffect(() => {
    const fetchClassSection = async () => {
      try {
        console.log('Fetching Class & Section...');
        setDropdownLoading(true);

        const schoolCode = await AsyncStorage.getItem('schoolCode');
        if (!schoolCode) {
          console.warn('School code is missing!');
          return;
        }

        // Fetch classes
        const classRes = await fetch(
          `https://cleezoclass.com:4000/api/admin/classes?schoolCode=${schoolCode}`
        );
        const classData = await classRes.json();
        setClasses(classData || []);

        // Fetch sections
        const sectionRes = await fetch(
          `https://cleezoclass.com:4000/api/admin/sectionFilter?schoolCode=${schoolCode}`
        );
        const sectionData = await sectionRes.json();
        setSectionData(sectionData);

        // Extract unique section names
        const uniqueSections = [...new Set(sectionData.map(item => item.section))];
        setSections(uniqueSections);

      } catch (err) {
        console.error('Error fetching class & section:', err);
        Alert.alert('Error', 'Failed to load class & section');
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchClassSection();
  }, []);
const classSortOrder: Record<string, number> = {
  'Nursery': 0,
  'LKG': 1,
  'UKG': 2,
  '1': 3,
  '2': 4,
  '3': 5,
  '4': 6,
  '5': 7,
  '6': 8,
  '7': 9,
  '8': 10,
  '9': 11,
  '10': 12,
  '11': 13,
  '12': 14,
};

const normalizeClassName = (item: any) =>
  String(item?.class_name || item?.class || item?.name || item || '').trim();

const sortedClassOptions = [...new Set(classes.map(normalizeClassName).filter(Boolean))].sort(
  (a, b) => (classSortOrder[a] ?? 999) - (classSortOrder[b] ?? 999)
);
  const availableSections = selectedClass
  ? [...new Set(
      sectionData
        .filter((item: any) => normalizeClassName(item) === selectedClass)
        .map((item: any) => String(item?.section || '').trim())
        .filter(Boolean)
    )].sort()
  : [];

  const timetableSummary = useMemo(() => {
    const sourceRows = viewMode === 'teacher' ? teacherTimetable : timetable;
    const schedule = buildSchedule(sourceRows);
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndexMap = new Map(daysOrder.map((day, index) => [day, index]));
    const now = new Date();
    const currentDayName = daysOrder[now.getDay() === 0 ? 0 : Math.min(now.getDay() - 1, 5)] || 'Monday';
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDayIndex = dayIndexMap.get(currentDayName) ?? 0;

    const next =
      schedule.find(
        (item) =>
          item.dayIndex === currentDayIndex && item.startMinutes > currentMinutes
      ) ||
      schedule.find((item) => item.dayIndex > currentDayIndex) ||
      schedule[0] ||
      null;
    const upcoming = next ? schedule[schedule.indexOf(next) + 1] || null : null;

    return { next, upcoming };
  }, [timetable, teacherTimetable, viewMode]);

  const openOverallMode = () => {
    setViewMode('class');
    if (selectedClass && selectedSection) {
      loadClassTimetable(selectedClass, selectedSection);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={ui.page}>
        <View style={ttStyles.summaryRow}>
          <View style={[ttStyles.summaryCard, ttStyles.summaryCardLeft]}>
            <Text style={ttStyles.summaryLabel}>Next Class</Text>
            <Text style={ttStyles.summaryTitle}>
              {timetableSummary.next ? timetableSummary.next.subject : 'No class'}
            </Text>
            <Text style={ttStyles.summaryMeta}>
              {timetableSummary.next
                ? `${timetableSummary.next.day} • ${timetableSummary.next.fromTime} - ${timetableSummary.next.toTime}`
                : 'No upcoming class found'}
            </Text>
          </View>

          <View style={[ttStyles.summaryCard, ttStyles.summaryCardRight]}>
            <Text style={ttStyles.summaryLabel}>Upcoming Class</Text>
            <Text style={ttStyles.summaryTitle}>
              {timetableSummary.upcoming ? timetableSummary.upcoming.subject : 'No class'}
            </Text>
            <Text style={ttStyles.summaryMeta}>
              {timetableSummary.upcoming
                ? `${timetableSummary.upcoming.day} • ${timetableSummary.upcoming.fromTime} - ${timetableSummary.upcoming.toTime}`
                : 'No more classes'}
            </Text>
          </View>
        </View>

        <View style={ui.card}>
          <Text style={ui.cardLabel}>Class and Section</Text>
          <View style={ui.modeSelector}>
            <Pressable
              style={[ui.modeButton, viewMode === 'teacher' && ui.modeButtonActive]}
              onPress={() => setViewMode('teacher')}
            >
              <Text style={[ui.modeButtonText, viewMode === 'teacher' && ui.modeButtonTextActive]}>Self</Text>
            </Pressable>
            <Pressable
              style={[ui.modeButton, viewMode === 'class' && ui.modeButtonActive]}
              onPress={openOverallMode}
            >
              <Text style={[ui.modeButtonText, viewMode === 'class' && ui.modeButtonTextActive]}>Overall</Text>
            </Pressable>
          </View>

          {viewMode === 'class' && (
            <View style={ui.dropdownShell}>
              <View style={[styles.dropdownContainer, { flex: 1, width: 'auto' }]}>
                <Picker
                  selectedValue={selectedClass}
                  onValueChange={(value) => {
                    setSelectedClass(value);
                    setSelectedSection('');
                    setTimetable([]);
                  }}
                  style={{ color: '#111827' }}
                  dropdownIconColor="#111827"
                >
                  <Picker.Item label="Select Class" value="" />
                  {sortedClassOptions.map((className) => (
                    <Picker.Item key={className} label={className} value={className} />
                  ))}
                </Picker>
              </View>

              <View style={[styles.dropdownContainer, { flex: 1, width: 'auto' }]}>
                <Picker
                  selectedValue={selectedSection}
                  onValueChange={(value) => {
                    setSelectedSection(value);
                    if (selectedClass && value) {
                      loadClassTimetable(selectedClass, value);
                    } else {
                      setTimetable([]);
                    }
                  }}
                  enabled={Boolean(selectedClass)}
                  style={{ color: '#111827' }}
                  dropdownIconColor="#111827"
                >
                  <Picker.Item label={selectedClass ? 'Select Section' : 'Select Class First'} value="" />
                  {availableSections.map((section) => (
                    <Picker.Item key={section} label={section} value={section} />
                  ))}
                </Picker>
              </View>
            </View>
          )}
        </View>

        <View style={ui.card}>
          <View style={ui.timetableCard}>
            {viewMode === 'teacher' ? (
              loading ? (
                <ActivityIndicator color="#2C2C2C" style={{ marginTop: 20 }} />
              ) : (
                renderTeacherTimetable(teacherTimetable)
              )
            ) : (
              <View style={styles.inputContainer}>
                <View style={styles.selectionContainer} />
                {loading ? <ActivityIndicator color="#2C2C2C" /> : renderTimetable(timetable)}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showTeacherTableModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTeacherTableModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTeacherTableModal(false)}>
          <View style={modalStyles.overlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={modalStyles.container}>
                <View style={modalStyles.header}>
                  <Text style={modalStyles.title}>My Timetable</Text>
                  <TouchableOpacity onPress={() => setShowTeacherTableModal(false)}>
                    <Text style={{ fontSize: 18 }}>x</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                  {loading ? (
                    <ActivityIndicator color="gray" style={{ marginTop: 20 }} />
                  ) : (
                    renderTeacherTimetable(teacherTimetable)
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
};

export default Teachertimetable;

const ttStyles = {
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    minHeight: 108,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E1E4EA',
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  summaryCardLeft: {
    backgroundColor: '#D7E8C9',
  },
  summaryCardRight: {
    backgroundColor: '#F2EE9E',
  },
  summaryLabel: {
    fontSize: 12.5,
    fontWeight: '700' as const,
    color: '#222222',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#111111',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 12.5,
    fontWeight: '500' as const,
    color: '#2B2B2B',
  },
};
