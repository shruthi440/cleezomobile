import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { globalStyles as styles } from '../styles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './App';
/* -------------------- TYPES -------------------- */
type TabType = 'Testperformance' | 'PerformanceGraph';
type AcademicTeacherNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AcademicTeacher'
>;

interface Teacher {
  id: string;
  name: string;
  subject: string;
}

const AcademicTeacher: React.FC = () => {
  const navigation = useNavigation<AcademicTeacherNavigationProp>();
  const route = useRoute<any>();
  // Tab state
  const [activeTab, setActiveTab] = useState<'syllabus' | 'test'>('syllabus');

  // Dropdown state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // School code
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load school code from AsyncStorage
  useEffect(() => {
    const loadSchoolCode = async () => {
      try {
        const storedCode = await AsyncStorage.getItem('schoolCode');
        setSchoolCode(storedCode);
      } catch (err) {
        console.error('Failed to load school code:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSchoolCode();
  }, []);

  // Fetch teachers when schoolCode is loaded
  useEffect(() => {
    console.log('🔁 useEffect triggered for fetching teachers');
    console.log('📌 Current schoolCode:', schoolCode);

    if (!schoolCode) {
      console.warn('❌ No school code, skipping fetch');
      return;
    }

    const fetchTeachers = async () => {
      try {
        console.log('🌐 Fetching teachers from API...');
        const res = await axios.get<Teacher[]>(
          'https://cleezoclass.com:4000/teachers',
          {
            params: { schoolCode },
          },
        );

        console.log('✅ API response:', res.data);

        if (Array.isArray(res.data)) {
          setTeachers(res.data);
          console.log(`🎉 Loaded ${res.data.length} teachers`);
        } else {
          console.error('❌ Teachers API did not return an array');
        }
      } catch (err) {
        console.error('❌ Error fetching teachers:', err);
      }
    };

    fetchTeachers();
  }, [schoolCode]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Academics - Staff</Text>
          </View>
          {/* Header: Title + Teacher dropdown */}
          <View
            style={[
              styles.headerRow,
              { justifyContent: 'flex-end' },
              { marginTop: -20 },
            ]}
          >
            <View
              style={[styles.dropdownContainer, { height: 40, width: 150 }]}
            >
              <Picker
                selectedValue={selectedTeacher?.id || ''}
                onValueChange={itemValue => {
                  // Find the teacher object from the teachers array
                  const teacher =
                    teachers.find(t => t.id === itemValue) || null;
                  setSelectedTeacher(teacher);
                  console.log('Selected teacher:', teacher);
                }}
                style={styles.picker}
                itemStyle={{ color: '#111827' }}
                dropdownIconColor="#fff"
              >
                <Picker.Item label="Select Teacher" value="" enabled={false} />
                {teachers.map(teacher => (
                  <Picker.Item
                    key={teacher.id}
                    label={teacher.name}
                    value={teacher.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Main Layout */}
          <View style={styles.mainLayout}>
            {/* LEFT COLUMN: Attendance & Overall */}
            <View style={styles.leftColumn}>
              <View style={[styles.smallCard]}>
                <Text style={styles.cardTitle}>Attendance</Text>
                <Text
                  style={[
                    styles.bigGrade,
                    { color: '#000' },
                    { marginTop: -3 },
                  ]}
                >
                  A
                </Text>
                <Text style={[styles.percentText, { color: '#000' }]}>68%</Text>
                <TouchableOpacity>
                  <Text style={styles.viewLink}>View Report</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.smallCard]}>
                <Text style={[styles.cardTitle, { color: '#000' }]}>
                  Overall
                </Text>
                <Text
                  style={[
                    styles.bigGrade,
                    { color: '#000' },
                    { marginTop: -15 },
                  ]}
                >
                  C+
                </Text>
                <Text style={[styles.percentText, { color: '#000' }]}>68%</Text>
                <TouchableOpacity>
                  <Text style={[styles.viewLink, { color: '#000' }]}>
                    View Report
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Combined Card */}
            <View style={styles.combinedCard}>
              <View style={styles.combinedSection}>
                <Text style={styles.cardTitle}>Progress Report</Text>
                <Text style={[styles.bigNum, { marginTop: -25 }]}>13</Text>
                <Text style={[styles.percentText]}>18% of total</Text>
                <TouchableOpacity>
                  <Text style={[styles.viewLink1, { marginTop: -5 }]}>
                    View List
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.combinedSection}>
                <Text style={[styles.cardTitle, { marginTop: 20 }]}>
                  Progress Report - Generated
                </Text>
                <Text style={[styles.bigNum, { marginTop: -38 }]}>114</Text>
                <Text style={styles.percentText}>68% of total</Text>
                <TouchableOpacity>
                  <Text style={styles.viewLink1}>View List</Text>
                </TouchableOpacity>
              </View>
            
            </View>
          </View>

          {/* Syllabus / Test Tabs */}

          <View style={styles.AccademicTeacher}>
            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('syllabus')}
                style={[
                  styles.tab,
                  activeTab === 'syllabus' && styles.activeTabBackground, // active background
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'syllabus'
                      ? styles.activeTabText // white text for active
                      : styles.inactiveTabText, // black text for inactive
                  ]}
                >
                  Syllabus
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('test')}
                style={[
                  styles.tab,
                  activeTab === 'test' && styles.activeTabBackground,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'test'
                      ? styles.activeTabText
                      : styles.inactiveTabText,
                  ]}
                >
                  Test Performance
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dashed line with symmetric notches */}
        

            {/* Content */}
            <View style={styles.syllabusContent}>
              <View style={styles.nameRow}>
                <Text style={styles.teacherName}>
                  {selectedTeacher ? selectedTeacher.name : 'Select a teacher'}
                </Text>
                <Text style={styles.classText}>
                  {selectedTeacher ? selectedTeacher.subject : ''}
                </Text>
              </View>

              <View style={styles.chartFrame}>
                <View style={styles.yAxis}>
                  {['dec', 'nov', 'oct', 'sep'].map(m => (
                    <Text key={m} style={styles.axisLabel}>
                      {m}
                    </Text>
                  ))}
                </View>
                <View style={styles.chartArea}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, styles.runBar, { height: 60 }]} />
                    <View style={[styles.bar, styles.lagBar, { height: 30 }]} />
                    <Text style={styles.barName}>6A</Text>
                  </View>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, styles.runBar, { height: 30 }]} />
                    <View style={[styles.bar, styles.lagBar, { height: 60 }]} />
                    <Text style={styles.barName}>6B</Text>
                  </View>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, styles.runBar, { height: 35 }]} />
                    <View style={[styles.bar, styles.lagBar, { height: 60 }]} />
                    <Text style={styles.barName}>7B</Text>
                  </View>
                </View>
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.box, styles.runBar]} />
                  <Text>Running</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.box, styles.lagBar]} />
                  <Text>Lagging</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={[styles.viewLink2, { marginTop: -30 }]}>
                View Report
              </Text>
            </TouchableOpacity>

            <View style={[styles.notchContainer4, { marginTop: '-1%' }]}>
              <View style={styles.leftNotch} />
              <View style={styles.dashedLine} />
              <View style={styles.rightNotch} />
            </View>
            <View style={styles.footerNotes}>
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
    </SafeAreaView>
  );
};

export default AcademicTeacher;
