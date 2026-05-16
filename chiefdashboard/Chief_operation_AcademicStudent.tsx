import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  BackHandler,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles as styles } from '../styles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './App';

/* -------------------- TYPES -------------------- */
type TabType = 'Testperformance' | 'PerformanceGraph';
type AcademicStudentNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AcademicStudent'
>;
/* -------------------- TYPES -------------------- */
type StudentItem = {
  id: number;
  name: string;
  class_name: string;
  section: string;
  schoolCode: string;
  user_type: 'student' | 'teacher' | string;
  class_teacher: string | null;
};

type AttendanceMonth = {
  month: string;
  present: number;
  total: number;
};

type AttendanceResponse = {
  monthly: AttendanceMonth[];
};

type PerformanceItem = {
  subject: string;
  FA: string[];
  SA: string[];
  total: string;
  percentage: string;
  overallGrade: string;
  testGrades: Record<string, any>;
};

const normalizePerformanceItem = (item: any): PerformanceItem => {
  const subject = String(item?.subject || '');

  if (Array.isArray(item?.FA) || Array.isArray(item?.SA)) {
    return {
      subject,
      FA: Array.isArray(item?.FA) ? item.FA : [],
      SA: Array.isArray(item?.SA) ? item.SA : [],
      total: String(item?.total || ''),
      percentage: String(item?.percentage || ''),
      overallGrade: String(item?.overallGrade || ''),
      testGrades: item?.testGrades || {},
    };
  }

  const tests = item?.tests || {};
  const parseMarks = (prefix: 'FA' | 'SA') => {
    return Object.keys(tests)
      .filter(key => key.toUpperCase().startsWith(prefix))
      .sort((a, b) => {
        const ai = Number(a.replace(/[^0-9]/g, '')) || 0;
        const bi = Number(b.replace(/[^0-9]/g, '')) || 0;
        return ai - bi;
      })
      .map(key => String(tests[key]?.obtained ?? 0));
  };

  return {
    subject,
    FA: parseMarks('FA'),
    SA: parseMarks('SA'),
    total: String(item?.total || ''),
    percentage: String(item?.percentage || ''),
    overallGrade: String(item?.overallGrade || ''),
    testGrades: item?.testGrades || {},
  };
};

/* -------------------- CONSTANTS -------------------- */
const STATIC_SECTIONS = ['A', 'B', 'C'];

/* -------------------- COMPONENT -------------------- */
const AcademicStudent: React.FC = () => {
  const navigation = useNavigation<AcademicStudentNavigationProp>();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState<TabType>('Testperformance');

  const [schoolCode, setSchoolCode] = useState<string>('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [classSections, setClassSections] = useState<
    { class_name: string; section: string }[]
  >([]);

  const [selectedClassSection, setSelectedClassSection] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [attendanceData, setAttendanceData] =
    useState<AttendanceResponse | null>(null);
  const [averageAttendance, setAverageAttendance] = useState<number>(0);
  const [performance, setPerformance] = useState<PerformanceItem[]>([]);
  const [overallPerformance, setOverallPerformance] = useState<number>(0);
  const [classTeacher, setClassTeacher] = useState<string>('');
  const API_BASE = 'https://cleezoclass.com:4000/api';

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
    axios.get(`${API_BASE}/admin/sectionFilter?schoolCode=${schoolCode}`);

    axios
      .get(`https://cleezoclass.com:4000/api/classes?schoolCode=${schoolCode}`)
      .then(res => setClasses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setClasses([]));
  }, [schoolCode]);

  /* -------------------- FETCH STUDENTS -------------------- */
  useEffect(() => {
    console.log('🔁 Students fetch effect triggered');

    if (!selectedClass || !selectedSection || !schoolCode) return;

    const url = `https://cleezoclass.com:4000/api/students?schoolCode=${schoolCode}&class=${selectedClass}&section=${selectedSection}`;

    axios
      .get(url)
      .then(res => {
        if (!Array.isArray(res.data)) {
          setStudents([]);
          setClassTeacher('');
          return;
        }

        const filteredStudents = res.data.filter(
          (student: StudentItem) =>
            String(student.class_name) === String(selectedClass) &&
            String(student.section).toUpperCase() ===
              String(selectedSection).toUpperCase() &&
            String(student.schoolCode) === String(schoolCode) &&
            student.user_type === 'student',
        );

        const uniqueMap = new Map<number, StudentItem>();
        filteredStudents.forEach(student => {
          if (!uniqueMap.has(student.id)) uniqueMap.set(student.id, student);
        });

        const sortedStudents = Array.from(uniqueMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setStudents(sortedStudents);
        setSelectedStudentId('');
        setClassTeacher(sortedStudents[0]?.class_teacher || '');
      })
      .catch(err => {
        console.error('❌ Students API error:', err?.response || err);
        setStudents([]);
      });
  }, [selectedClass, selectedSection, schoolCode]);

  /* -------------------- HANDLE CLASS-SECTION SELECTION -------------------- */
  const handleClassSectionChange = (value: string) => {
    setSelectedClassSection(value);
    if (!value) {
      setSelectedClass('');
      setSelectedSection('');
      setStudents([]);
      return;
    }
    const [cls, section] = value.split('-');
    setSelectedClass(cls.trim());
    setSelectedSection(section.trim());
  };

  /* -------------------- FETCH ATTENDANCE -------------------- */
  useEffect(() => {
    if (!selectedStudentId) return;

    const student = students.find(s => s.id.toString() === selectedStudentId);
    if (!student) return;

    axios
      .post('https://cleezoclass.com:4000/api/report/attendance/monthly', {
        name: student.name,
        class_name: selectedClass,
        section: selectedSection,
        schoolCode,
      })
      .then(res => {
        const data: AttendanceResponse = res.data;
        setAttendanceData(data);
        const lastMonths = data?.monthly?.slice(-6) || [];
        const avg = lastMonths.length
          ? lastMonths.reduce(
              (sum, m) => sum + (m.present / m.total) * 100,
              0,
            ) / lastMonths.length
          : 0;
        setAverageAttendance(Number(avg.toFixed(2)));
      })
      .catch(err =>
        console.error('❌ Attendance API error:', err?.response || err),
      );
  }, [selectedStudentId, students, selectedClass, selectedSection, schoolCode]);

  const getAttendanceGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const selectedStudent = students.find(
    s => s.id.toString() === selectedStudentId,
  );

  /* -------------------- FETCH PERFORMANCE -------------------- */
  useEffect(() => {
    if (!selectedStudentId) return;
    const student = students.find(s => s.id.toString() === selectedStudentId);
    if (!student) return;

    axios
      .post('https://cleezoclass.com:4000/api/overall/academic-performance', {
        name: student.name,
        class_name: selectedClass,
        section: selectedSection,
        schoolCode,
      })
      .then(res => {
        const raw = res.data;
        const source = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.performance)
          ? raw.performance
          : [];

        const data: PerformanceItem[] = source.map(normalizePerformanceItem);
        setPerformance(Array.isArray(data) ? data : []);

        if (data.length) {
          const overallPercentages = data.map(item => {
            const faMarks = (item.FA || []).map(x => parseFloat(x) || 0);
            const saMarks = (item.SA || []).map(x => parseFloat(x) || 0);
            const totalObtained = [...faMarks, ...saMarks].reduce(
              (sum, m) => sum + m,
              0,
            );
            const maxMarks = faMarks.length * 20 + saMarks.length * 80;
            return maxMarks ? (totalObtained / maxMarks) * 100 : 0;
          });
          const avgOverall =
            overallPercentages.reduce((sum, p) => sum + p, 0) /
            overallPercentages.length;
          setOverallPerformance(Number(avgOverall.toFixed(2)));
        } else setOverallPerformance(0);
      })
      .catch(err => {
        console.error('❌ Performance API error:', err?.response || err);
        setPerformance([]);
        setOverallPerformance(0);
      });
  }, [selectedStudentId, students, selectedClass, selectedSection, schoolCode]);

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };
  useEffect(() => {
    if (!schoolCode) return;

    console.log('📡 Fetching Class-Sections...');

    axios
      .get(`${API_BASE}/admin/sectionFilter?schoolCode=${schoolCode}`)
      .then(res => {
        console.log('✅ Sections Raw Response:', res.data);

        if (Array.isArray(res.data)) {
          setClassSections(res.data); // ✅ store full response
        } else {
          setClassSections([]);
        }
      })
      .catch(err => {
        console.log('❌ Sections Error:', err?.response || err);
        setClassSections([]);
      });
  }, [schoolCode]);

  const calculatePercentage = (fa: string[], sa: string[]) => {
    const faMarks = fa.map(m => parseFloat(m) || 0);
    const saMarks = sa.map(m => parseFloat(m) || 0);
    const obtained = [...faMarks, ...saMarks].reduce((a, b) => a + b, 0);
    const max = faMarks.length * 20 + saMarks.length * 80;
    return max ? Math.round((obtained / max) * 100) : 0;
  };

  const attendanceGrade = getAttendanceGrade(averageAttendance);
  const performanceGrade = getGrade(overallPerformance);
  const getClassOrder = (cls: string) => {
    const value = cls.toUpperCase().trim();

    if (value === 'NURSERY') return 0;
    if (value === 'LKG') return 1;
    if (value === 'UKG') return 2;

    // If numeric class (1–12)
    const num = parseInt(value);
    if (!isNaN(num)) return 2 + num;

    return 999; // anything unknown goes last
  };
  const renderReportModal = () => {
    if (!selectedStudent) return null;

    return (
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent1}>
            <ScrollView>
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>

              {/* Student Info */}
              <Text style={styles.modalTitle1}>{selectedStudent.name}</Text>
              <Text style={styles.modalSubtitle}>
                {selectedClass && selectedSection
                  ? `Class ${selectedClass} - Section ${selectedSection}`
                  : 'Class - Section'}
              </Text>

              {/* Class Teacher */}
              <View style={styles.modalCard}>
                <Text style={styles.cardTitle}>Class Teacher</Text>
                <Text style={[styles.bigGradeBlack, { fontSize: 16 }]}>
                  {classTeacher || 'Not Assigned'}
                </Text>
              </View>

              {/* Attendance */}
              <View style={styles.modalCard}>
                <Text style={styles.cardTitle}>Attendance</Text>
                <Text style={styles.bigGradeBlack}>{attendanceGrade}</Text>
                <Text style={styles.percentTextBlack}>
                  {averageAttendance.toFixed(2)}%
                </Text>
              </View>

              {/* Performance */}
              <View style={styles.modalCard}>
                <Text style={styles.cardTitle}>Overall Performance</Text>
                <Text style={styles.bigGradeBlack}>{performanceGrade}</Text>
                <Text style={styles.percentTextBlack}>
                  {overallPerformance.toFixed(2)}%
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  /* -------------------- UI -------------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Academics - Student</Text>
          </View>
          {/* HEADER */}
          <View style={[styles.headerRow, { justifyContent: 'flex-end' }]}>
            <View style={styles.dropdownRow}>
              {/* CLASS-SECTION PICKER */}
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectedClassSection}
                  onValueChange={handleClassSectionChange}
                  style={styles.picker}
                  itemStyle={{ color: '#111827' }}
                  dropdownIconColor="#fff"
                >
                  <Picker.Item label="Select Class - Section" value="" />

                  {classSections
                    .sort((a, b) => {
                      const orderA = getClassOrder(a.class_name);
                      const orderB = getClassOrder(b.class_name);

                      if (orderA !== orderB) return orderA - orderB;

                      // If same class, sort sections alphabetically
                      return a.section.localeCompare(b.section);
                    })
                    .map((item, index) => (
                      <Picker.Item
                        key={`${item.class_name}-${item.section}-${index}`}
                        label={`Class ${item.class_name} - Section ${item.section}`}
                        value={`${item.class_name} - ${item.section}`}
                      />
                    ))}
                </Picker>
              </View>

              {/* STUDENT */}
              <View style={styles.dropdownContainer}>
                <Picker
                  style={styles.picker}
                  itemStyle={{ color: '#111827' }}
                  dropdownIconColor="#fff" // ✅ WHITE ARROW
                  selectedValue={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                  enabled={students.length > 0}
                >
                  <Picker.Item label="Student" value="" />
                  {students.map(s => (
                    <Picker.Item
                      key={s.id}
                      label={s.name}
                      value={s.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.mainLayout}>
            {/* Left Cards */}
            <View style={styles.leftColumn}>
              <View style={styles.smallCard}>
                <Text style={styles.cardTitle}>Attendance</Text>
                <Text style={styles.bigGradeBlack}>{attendanceGrade}</Text>

                <Text style={styles.percentTextBlack}>
                  {averageAttendance.toFixed(2)}%
                </Text>
                <TouchableOpacity onPress={() => setReportModalVisible(true)}>
                  <Text style={styles.viewLinkBlue}>View Report</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.smallCard]}>
                <Text style={styles.cardTitleBlack}>Overall</Text>
                <Text style={styles.bigGradeBlack}>C+</Text>
                <Text style={styles.percentTextBlack}>68%</Text>
                <TouchableOpacity onPress={() => setReportModalVisible(true)}>
                  <Text style={styles.viewLinkBlack}>View Report</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Card with Notches */}

            {/* Card */}
            <View style={styles.combinedCard}>
              <View style={styles.combinedSection}>
                <Text style={styles.cardTitle}>Progress Report</Text>
                <Text style={styles.bigNum}>{performanceGrade}</Text>

                <Text style={styles.percentTextBlack}>
                  {overallPerformance.toFixed(2)}%
                </Text>

                <TouchableOpacity onPress={() => setReportModalVisible(true)}>
                  <Text style={styles.viewLinkBlue3}>View Report</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.combinedSection}>
                <Text style={[styles.cardTitle, { marginTop: 5 }]}>
                  Class Teacher
                </Text>
                <Text
                  style={[styles.bigNum, { fontSize: 15 }, { marginTop: 8 }]}
                >
                  {classTeacher || 'Class Teacher'}
                </Text>
                <Text style={styles.percentText}>Mathematics</Text>
                <TouchableOpacity onPress={() => setReportModalVisible(true)}>
                  <Text style={styles.viewLink1}>View List</Text>
                </TouchableOpacity>
              </View>

              {/* CENTERED NOTCH */}
             
            </View>
          </View>
          {/* TABS */}
          <View style={styles.syllabusContainer1}>
            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('Testperformance')}
                style={[
                  styles.tab,
                  activeTab === 'Testperformance' && styles.activeTabBackground,
                ]}
              >
                <Text
                  style={
                    activeTab === 'Testperformance'
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }
                >
                  Test Performance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('PerformanceGraph')}
                style={[
                  styles.tab,
                  activeTab === 'PerformanceGraph' &&
                    styles.activeTabBackground,
                ]}
              >
                <Text
                  style={
                    activeTab === 'PerformanceGraph'
                      ? styles.activeTabText
                      : styles.inactiveTabText
                  }
                >
                  Performance Graph
                </Text>
              </TouchableOpacity>
            </View>

           
            <View style={styles.syllabusContent}>
              <View style={styles.nameRow}>
                <Text style={styles.teacherName}>
                  {selectedStudent?.name || 'Student Name'}
                </Text>

                <Text style={styles.classText}>
                  {selectedClass && selectedSection
                    ? `Class ${selectedClass} - Section ${selectedSection}`
                    : 'Class - Section'}
                </Text>
              </View>
              <View style={styles.chartFrame}>
                {/* Y Axis */}

                {/* Chart */}
                <View style={styles.chartArea}>
                  {performance.map((item, index) => {
                    const percent = calculatePercentage(item.FA, item.SA);

                    return (
                      <View key={index} style={styles.barPair}>
                        <View
                          style={[
                            styles.bar,
                            styles.runBar,
                            { height: Math.min(percent, 40) }, // 🔥 max height limited to 100
                          ]}
                        />

                        <Text style={styles.barName}>{item.subject}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.box, styles.runBar]} />
                  <Text>Max</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.box, styles.lagBar]} />
                  <Text>Obtain</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewLinkCenter}>View Report</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.notchContainer4, { marginTop: '-1%' }]}>
              <View style={styles.leftNotch} />
              <View style={styles.dashedLine} />
              <View style={styles.rightNotch} />
            </View>

            <View style={styles.footerNotes1}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true} // important if parent also scrolls
              >
                <View style={styles.noteRow}>
                  <Text style={styles.bullet}>
                    • FA1, Maths 35M-Below Satisfactory
                  </Text>
                  <TouchableOpacity style={styles.blackBtn}>
                    <Text style={styles.btnText}>Censure</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.noteRow}>
                  <Text style={styles.bullet}>• Attendance - Unpunctual</Text>
                  <TouchableOpacity style={styles.blackBtn}>
                    <Text style={styles.btnText}>Censure</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.noteRow}>
                  <Text style={styles.bullet}>
                    • FA1, Maths 35M-Below Satisfactory
                  </Text>
                  <TouchableOpacity style={styles.blackBtn}>
                    <Text style={styles.btnText}>Censure</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.noteRow}>
                  <Text style={styles.bullet}>• Attendance - Unpunctual</Text>
                  <TouchableOpacity style={styles.blackBtn}>
                    <Text style={styles.btnText}>Censure</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>
      {renderReportModal()}
    </SafeAreaView>
  );
};

export default AcademicStudent;
