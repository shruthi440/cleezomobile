import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
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

type StudentItem = {
  id: number;
  name: string;
  class_name: string;
  section: string;
  schoolCode: string;
  user_type: 'student' | 'teacher' | string;
  class_teacher: string | null;
};

const AcademicStudent: React.FC = () => {
  const navigation = useNavigation<AcademicStudentNavigationProp>();
  const route = useRoute<any>();

  const [activeTab, setActiveTab] = useState<TabType>('Testperformance');
  const [schoolCode, setSchoolCode] = useState<string>('');

  const [classes, setClasses] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]); // ✅ NEW
  const [students, setStudents] = useState<StudentItem[]>([]);

  const [selectedClassSection, setSelectedClassSection] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const API_BASE = 'https://cleezoclass.com:4000/api';

  /* -------------------- LOAD SCHOOL CODE -------------------- */
  useEffect(() => {
    const loadSchoolCode = async () => {
      const code = await AsyncStorage.getItem('schoolCode');
      console.log('📌 Loaded schoolCode:', code);
      if (code) setSchoolCode(code);
    };
    loadSchoolCode();
  }, []);

  /* -------------------- FETCH CLASSES -------------------- */
  useEffect(() => {
    if (!schoolCode) return;

    console.log('📡 Fetching Classes...');
    axios
      .get(`${API_BASE}/classes?schoolCode=${schoolCode}`)
      .then(res => {
        console.log('✅ Classes Response:', res.data);
        setClasses(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.log('❌ Classes Error:', err?.response || err);
        setClasses([]);
      });
  }, [schoolCode]);

  /* -------------------- FETCH SECTIONS (DYNAMIC) -------------------- */
  /* -------------------- FETCH SECTIONS (DYNAMIC) -------------------- */
  useEffect(() => {
    if (!schoolCode) return;

    console.log('📡 Fetching Sections...');

    axios
      .get(`${API_BASE}/admin/sectionFilter?schoolCode=${schoolCode}`)
      .then(res => {
        console.log('✅ Sections Raw Response:', res.data);

        let sectionList: string[] = [];

        // ✅ If API returns array
        if (Array.isArray(res.data)) {
          sectionList = res.data.map((item: any) => item.section);
        }

        // ✅ If API returns single object
        else if (res.data?.section) {
          sectionList = [res.data.section];
        }

        // Remove duplicates
        const uniqueSections = [...new Set(sectionList)];

        console.log('🎯 Final Sections:', uniqueSections);

        setSections(uniqueSections);
      })
      .catch(err => {
        console.log('❌ Sections Error:', err?.response || err);
        setSections([]);
      });
  }, [schoolCode]);

  /* -------------------- FETCH STUDENTS -------------------- */
  useEffect(() => {
    if (!selectedClass || !selectedSection || !schoolCode) return;

    console.log('📡 Fetching Students...');
    console.log('Class:', selectedClass);
    console.log('Section:', selectedSection);

    axios
      .get(
        `${API_BASE}/students?schoolCode=${schoolCode}&class=${selectedClass}&section=${selectedSection}`,
      )
      .then(res => {
        console.log('✅ Students Response:', res.data);

        if (!Array.isArray(res.data)) {
          setStudents([]);
          return;
        }

        const filtered = res.data.filter(
          (s: StudentItem) => s.user_type === 'student',
        );

        setStudents(filtered);
        setSelectedStudentId('');
      })
      .catch(err => {
        console.log('❌ Students Error:', err?.response || err);
        setStudents([]);
      });
  }, [selectedClass, selectedSection, schoolCode]);

  /* -------------------- HANDLE CLASS-SECTION -------------------- */
  const handleClassSectionChange = (value: string) => {
    console.log('🎯 Selected Class-Section:', value);

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

  /* -------------------- UI -------------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Academics - Student</Text>
          </View>

          {/* DROPDOWNS */}
          <View style={styles.dropdownRow}>
            {/* CLASS - SECTION */}
            <View style={styles.dropdownContainer}>
              <Picker
                selectedValue={selectedClassSection}
                onValueChange={handleClassSectionChange}
                style={styles.picker}
                itemStyle={{ color: '#111827' }}
                dropdownIconColor="#fff"
              >
                <Picker.Item label="Select Class - Section" value="" />

                {classes
                  .flatMap(cls =>
                    sections.map(sec => ({
                      label: `Class ${cls} - Section ${sec}`,
                      value: `${cls} - ${sec}`,
                    })),
                  )
                  .map(item => (
                    <Picker.Item
                      key={item.value}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
              </Picker>
            </View>

            {/* STUDENT */}
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
                    value={s.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AcademicStudent;
