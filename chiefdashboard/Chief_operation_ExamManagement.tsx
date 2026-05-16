import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles as styles } from '../styles';

import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

/* -------------------- TYPES -------------------- */
type ExamManagementNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ExamManagement'
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

interface EventSummary {
  total_events: number;
  upcoming_events: number;
  conducted_events: number;
  events_pending_approval: number;
}
interface QPStatus {
  total_classes: number;
  classes_with_qp: number;
  pending_classes: number;
  pending_class_list: any[];
}

interface InvigilatorStatus {
  total_invigilators: number;
  pending_classes: string[];
  assignments: any[];
}

interface SeatingStatus {
  total_assignments: number;
  rooms_assigned: any[];
}

interface ScanPullStatus {
  total_scanned: number;
  pending_scan: number;
  report_card_pending: number;
  pending_class_list: any[]; // <-- fix here
}
interface PendingClass {
  class_name: string;
  section?: string;
}
interface ExamData {
  qpStatus: QPStatus;
  invigilatorStatus: InvigilatorStatus;
  seatingStatus: SeatingStatus;
  scanPull: ScanPullStatus;
}
const STATIC_SECTIONS = ['A', 'B', 'C'];
const BASE_URL = 'https://cleezoclass.com:4000/api'; // Centralized URL

const ExamManagement: React.FC = () => {
  const navigation = useNavigation<ExamManagementNavigationProp>();

  /* ---------- STATE ---------- */
  const [schoolCode, setSchoolCode] = useState<string>('');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('');
  const [selectedClassSection, setSelectedClassSection] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const [classes, setClasses] = useState<string[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [completedEvents, setCompletedEvents] = useState<any[]>([]);
  const [classTeacher, setClassTeacher] = useState<string>('');

  const [examData, setExamData] = useState<ExamData>({
    qpStatus: { total_qp: 0, pending_approval: 0, classes_pending: [] },
    invigilatorStatus: {
      total_invigilators: 0,
      pending_classes: [],
      assignments: [],
    },
    seatingStatus: { total_assignments: 0, rooms_assigned: [] },
    scanPull: {
      total_scanned: 0,
      pending_scan: 0,
      report_card_pending: 0,
      pending_class_list: [],
    },
  });

  const [eventSummary, setEventSummary] = useState<EventSummary>({
    total_events: 0,
    upcoming_events: 0,
    conducted_events: 0,
    events_pending_approval: 0,
  });

  /* -------------------- HELPERS -------------------- */
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
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
      value: `${year}-${String(idx + 1).padStart(2, '0')}`,
    })),
  );

  /* -------------------- DATA FETCHING -------------------- */

  // 1. Load School Code first
  useEffect(() => {
    const loadInitialData = async () => {
      const code = await AsyncStorage.getItem('schoolCode');
      if (code) setSchoolCode(code);
    };
    loadInitialData();
  }, []);
  const [loadingExamData, setLoadingExamData] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState('FA1');
  // 2. Fetch Exam Data (Depends on schoolCode and MonthYear)
  // --- FETCH EXAM DATA ---
  useEffect(() => {
    const fetchExamData = async () => {
      if (!schoolCode) {
        console.log('⚠️ Fetch skipped: schoolCode is empty');
        return;
      }

      console.log(
        `🚀 FETCH EXAM DATA START | schoolCode: ${schoolCode} | examType: ${selectedExamType}`,
      );
      setLoadingExamData(true);

      try {
        const [qpRes, invigilatorRes, seatingRes, scanRes] = await Promise.all([
          axios.get(`https://cleezoclass.com:4000/api/qp-pending`, {
            params: { schoolCode, examType: selectedExamType },
          }),
          axios.get(`https://cleezoclass.com:4000/api/invigilator-status`, {
            params: { schoolCode, examType: selectedExamType },
          }),
          axios.get(`https://cleezoclass.com:4000/api/seating-status`, {
            params: { schoolCode, examType: selectedExamType },
          }),
          axios.get(`https://cleezoclass.com:4000/api/pending-classes`, {
            params: { schoolCode },
          }),
        ]);

        console.log('--- API RESPONSE LOGS ---');
        console.log('📊 QP Status:', qpRes.data);
        console.log('👨‍🏫 Invigilator Status:', invigilatorRes.data);
        console.log('🪑 Seating Status:', seatingRes.data);
        console.log('📋 Scan/Pull List:', scanRes.data);

        const pendingClasses = Array.isArray(scanRes.data) ? scanRes.data : [];
        const invigilatorData = invigilatorRes.data || {};
        const assignments = Array.isArray(invigilatorData.assignments)
          ? invigilatorData.assignments
          : [];

        setExamData({
          qpStatus: qpRes.data || {
            total_qp: 0,
            pending_approval: 0,
            classes_pending: [],
          },
          invigilatorStatus: {
            total_invigilators: assignments.length,
            pending_classes: Array.isArray(invigilatorData.pending_classes)
              ? invigilatorData.pending_classes
              : [],
            assignments: assignments,
          },
          seatingStatus: seatingRes.data || {
            total_assignments: 0,
            rooms_assigned: [],
          },
          scanPull: {
            total_scanned: 300,
            pending_scan: pendingClasses.length,
            report_card_pending: pendingClasses.length * 16,
            pending_class_list: pendingClasses,
          },
        });

        console.log('✅ EXAM DATA STATE UPDATED', { examData });
      } catch (err: any) {
        console.error('❌ FETCH EXAM DATA ERROR:', err.message);
        if (err.response) console.error('Error Details:', err.response.data);
      } finally {
        setLoadingExamData(false);
        console.log('⏹ FETCH EXAM DATA END');
      }
    };

    fetchExamData();
  }, [schoolCode, selectedExamType]);

  // --- FETCH CLASSES & EVENTS ---
  useEffect(() => {
    if (!schoolCode) {
      console.log('⚠️ Fetch skipped: schoolCode is empty (classes/events)');
      return;
    }

    const fetchData = async () => {
      console.log(
        `🚀 FETCH CLASSES & EVENTS START | schoolCode: ${schoolCode}`,
      );
      try {
        const [clsRes, upcomingRes, completedRes] = await Promise.all([
          axios.get(`${BASE_URL}/classes`, { params: { schoolCode } }),
          axios.get(`${BASE_URL}/upcoming-events`, { params: { schoolCode } }),
          axios.get(`${BASE_URL}/completed-events`, { params: { schoolCode } }),
        ]);

        console.log('--- API RESPONSE LOGS ---');
        console.log('🏫 Classes:', clsRes.data);
        console.log('📅 Upcoming Events:', upcomingRes.data);
        console.log('✅ Completed Events:', completedRes.data);

        setClasses(clsRes.data ?? []);
        setUpcomingEvents(upcomingRes.data ?? []);
        setCompletedEvents(completedRes.data ?? []);
        setEventSummary(prev => ({
          ...prev,
          upcoming_events: upcomingRes.data?.length ?? 0,
          conducted_events: completedRes.data?.length ?? 0,
        }));

        console.log('✅ CLASSES & EVENTS STATE UPDATED', {
          classes: clsRes.data,
          upcomingEvents: upcomingRes.data,
          completedEvents: completedRes.data,
        });
      } catch (err) {
        console.error('❌ FETCH CLASSES & EVENTS ERROR:', err);
      } finally {
        console.log('⏹ FETCH CLASSES & EVENTS END');
      }
    };

    fetchData();
  }, [schoolCode]);
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    content: null as React.ReactNode,
    downloadData: [] as any[],
  });

  // 4. Handle Class/Section Change
  const handleClassSectionChange = (value: string) => {
    setSelectedClassSection(value);
    if (!value) return;
    const [cls, sec] = value.split(' - ');
    setSelectedClass(cls.trim());
    setSelectedSection(sec.trim());
  };
  const handleOpenPopup = (type: string, data: any) => {
    let title = '';
    let content: React.ReactNode = null;
    let downloadData: any[] = [];

    if (type === 'qp_status') {
      title = 'QP Status';

      const pendingClasses = Array.isArray(data.pending_class_list)
        ? data.pending_class_list.filter(Boolean) // remove null/undefined
        : [];

      content = (
        <View>
          <Text style={modalStyles.infoText}>
            Total Classes: {data.total_classes}
          </Text>
          <Text style={modalStyles.infoText}>
            Classes with QP: {data.classes_with_qp}
          </Text>
          <Text style={modalStyles.infoText}>
            Pending Classes: {data.pending_classes}
          </Text>
        </View>
      );
      downloadData = pendingClasses;
    } else if (type === 'invigilator_assignments') {
      title = `Assignments (${data.length})`;
      content = (
        <View style={{ maxHeight: 400 }}>
          <View style={modalStyles.tableHeader}>
            <Text style={[modalStyles.headerCell, { flex: 1 }]}>Cls</Text>
            <Text style={[modalStyles.headerCell, { flex: 3 }]}>Teacher</Text>
            <Text style={[modalStyles.headerCell, { flex: 2 }]}>Date</Text>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={modalStyles.tableRow}>
                <Text style={{ flex: 1 }}>{item.class_name || 'N/A'}</Text>
                <Text style={{ flex: 3 }}>{item.teacher_name || 'N/A'}</Text>
                <Text style={{ flex: 2, fontSize: 10 }}>
                  {item.assigned_date
                    ? new Date(item.assigned_date).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            )}
          />
        </View>
      );
      downloadData = data;
    } else if (type === 'scan_pull_pending') {
      title = `Pending Scan (${data.pending_scan})`;

      const pendingClasses = Array.isArray(data.pending_class_list)
        ? data.pending_class_list.filter(Boolean)
        : [];

      content = (
        <View>
          <Text style={modalStyles.subHeading}>Pending Classes:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {pendingClasses.length > 0 ? (
              pendingClasses.map((item: any, i: number) => (
                <Text key={i} style={[modalStyles.listItem, { width: '50%' }]}>
                  • {item.class_name || 'N/A'} {item.section || ''}
                </Text>
              ))
            ) : (
              <Text style={modalStyles.listItem}>No classes pending.</Text>
            )}
          </View>
        </View>
      );
      downloadData = pendingClasses;
    } else if (type === 'seating_status') {
      title = `Seating Status (${data.total_assignments})`;

      const rooms = Array.isArray(data.rooms_assigned)
        ? data.rooms_assigned
        : [];

      content = (
        <View>
          <Text style={modalStyles.subHeading}>Assigned Rooms:</Text>
          {rooms.length > 0 ? (
            rooms.map((room: string, i: number) => (
              <Text key={i} style={modalStyles.listItem}>
                • {room}
              </Text>
            ))
          ) : (
            <Text style={modalStyles.listItem}>No rooms assigned yet.</Text>
          )}
        </View>
      );
      downloadData = rooms;
    }
    setPopup({ isOpen: true, title, content, downloadData });
  };

  const handleClosePopup = () =>
    setPopup({ isOpen: false, title: '', content: null, downloadData: [] });
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionHeading}>Exam Management</Text>
            <View style={styles.dropdownRow}>
              <View style={styles.dropdownContainer}>
                {/* NATIVE PICKER FOR EXAM TYPE */}
                <Picker
                  style={styles.picker}
                  itemStyle={{ color: '#111827' }}
                  dropdownIconColor="#fff"
                  selectedValue={selectedExamType}
                  onValueChange={itemValue => setSelectedExamType(itemValue)}
                >
                  <Picker.Item label="FA1" value="FA1" />
                  <Picker.Item label="FA2" value="FA2" />
                  <Picker.Item label="SA1" value="SA1" />
                  <Picker.Item label="FA3" value="FA3" />
                  <Picker.Item label="FA4" value="FA4" />

                  <Picker.Item label="SA2" value="SA2" />
                </Picker>
              </View>
            </View>
          </View>

          {/* TOP CARDS */}
          <View style={styles.mainLayout1}>
            <View style={styles.leftColumn1}>
              <View style={styles.smallCard1}>
                <Text style={styles.cardTitle}>Scan & Pull</Text>
                {/* Fixed: accessing the correct nested property */}
                <Text style={styles.bigGradeBlack}>
                  {examData.scanPull.pending_scan}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    handleOpenPopup('scan_pull_pending', examData.scanPull)
                  }
                >
                  <Text style={styles.viewLinkBlue1}>Need Action</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.smallCard1]}>
                <Text style={styles.cardTitleBlack}>QP. Generation</Text>
                <Text style={styles.bigGradeBlack}>
                  {examData.qpStatus.total_qp}
                </Text>
                <TouchableOpacity   
                  onPress={() =>
                    handleOpenPopup('qp_status', examData.qpStatus)
                  }
                >
                  <Text style={styles.viewLinkBlack1}>Need Action</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rightColumn1}>
              <View style={styles.combinedCard1}>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: -40 }]}>
                    Invigilation
                  </Text>
                  <Text style={styles.bigNum}>
                    {examData.invigilatorStatus.total_invigilators}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleOpenPopup(
                        'invigilator_assignments',
                        examData.invigilatorStatus.assignments,
                      )
                    }
                  >
                    <Text style={[styles.viewLinkBlue1, { marginTop: -10 }]}>
                      View List
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: 20 }]}>
                    Seating Order
                  </Text>
                  <Text style={[styles.bigNum, { fontSize: 15 }]}>
                    {examData.seatingStatus.total_assignments}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleOpenPopup('seating_status', examData.seatingStatus)
                    }
                  >
                    <Text style={styles.viewLink1}>Need Action</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* TIMETABLE SECTION */}
          <View style={[styles.headerRow, { marginTop: -80 }]}>
            <Text
              style={[
                styles.sectionHeading,
                { textDecorationLine: 'underline' },
              ]}
            >
              Timetable
            </Text>
            <View style={styles.dropdownRow}>
              <View style={styles.dropdownContainer}>
                <Picker
                  style={styles.picker}
                  itemStyle={{ color: '#111827' }}
                  dropdownIconColor="#fff"
                  selectedValue={selectedClassSection}
                  onValueChange={handleClassSectionChange}
                >
                  <Picker.Item label="Select Class - Section" value="" />
                  {classes.map(cls =>
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
            </View>
          </View>

          {/* BOTTOM CARDS */}
          <View style={styles.mainLayout1}>
            <View style={styles.leftColumn1}>
              <View style={styles.smallCard1}>
                <Text style={styles.cardTitle}>Total Generations</Text>
                <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                  <Text style={styles.bigGradeBlack}>
                    {completedEvents.length}
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewLinkBlue1}>View Report</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.smallCard1]}>
                <Text style={styles.cardTitleBlack}>Pending Generations</Text>
                <Text style={styles.bigGradeBlack}>
                  {eventSummary.upcoming_events}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.viewLinkBlack1}>Need Action</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rightColumn1}>
              <View style={styles.combinedCard1}>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: -40 }]}>
                    Re-Generations
                  </Text>
                  <Text style={styles.bigNum}>
                    {upcomingEvents.length} upcoming
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.viewLinkBlue1}>View List</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.combinedSection}>
                  <Text style={[styles.cardTitle, { marginTop: 20 }]}>
                    Substitutes
                  </Text>
                  <Text style={[styles.bigNum, { fontSize: 15 }]}>
                    {classTeacher || 'None'}
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.viewLink1}>View List</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={popup.isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePopup}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modalContainer}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>{popup.title}</Text>
              <TouchableOpacity onPress={handleClosePopup}>
                <Text style={modalStyles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.modalContent}>{popup.content}</View>

            {popup.downloadData.length > 0 && (
              <TouchableOpacity style={modalStyles.downloadBtn}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Download Data
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButton: { fontSize: 20, color: '#999', padding: 5 },
  modalContent: { marginBottom: 20 },
  infoText: { fontSize: 15, marginBottom: 8 },
  subHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  listItem: { fontSize: 14, color: '#555', paddingVertical: 2 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  headerCell: { fontWeight: 'bold', fontSize: 12 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  downloadBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default ExamManagement;
