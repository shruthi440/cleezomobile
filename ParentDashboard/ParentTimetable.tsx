import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { RootStackParamList } from '../types';
import { ErrorContext } from '../ErrorContext';

const ParentTimetable: React.FC<
  NativeStackScreenProps<RootStackParamList, 'ParentTimetable'>
  & { embedded?: boolean }
> = ({ embedded = false }) => {
  const [studentData, setStudentData] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useContext(ErrorContext);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const keys = ['studentId', 'name', 'class_name', 'section', 'schoolCode', 'username'];
        const stores = await AsyncStorage.multiGet(keys);
        const data: any = {};
        stores.forEach(([key, value]) => {
          if (value) data[key] = value;
        });
        setStudentData(data);
      } catch (error) {
        console.error('Failed to load student data:', error);
      }
    };

    loadStudent();
  }, []);

  useEffect(() => {
    const fetchTT = async () => {
      try {
        if (!studentData?.class_name || !studentData?.section || !studentData?.schoolCode) {
          setLoading(false);
          return;
        }

        const url = `http://162.215.210.38:3010/api/parent-timetable?class_id=${encodeURIComponent(studentData.class_name)}&section_id=${encodeURIComponent(studentData.section)}&schoolCode=${encodeURIComponent(studentData.schoolCode)}`;
        const res = await axios.get(url);
        const data = res.data.timetable || [];

        const dayMap: any = {};
        data.forEach((item: any) => {
          dayMap[item.day] = {
            day: item.day,
            periods: item.periods || {
              morning: [],
              afternoon: [],
              evening: [],
              night: [],
            },
          };
        });

        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const sortedData = Object.values(dayMap).sort(
          (a: any, b: any) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day)
        );

        setTimetable(sortedData);
      } catch (error) {
        console.error('Timetable error:', error);
        showError('Timetable Error', 'Unable to load timetable. Please try again.');
        setTimetable([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTT();
  }, [studentData, showError]);

  const getSortedPeriods = (row: any) => {
    const allPeriods = [
      ...(row.periods?.morning || []),
      ...(row.periods?.afternoon || []),
      ...(row.periods?.evening || []),
      ...(row.periods?.night || []),
    ];

    const uniqueMap = new Map();
    allPeriods.forEach((period: any) => {
      const key = `${period.fromTime}-${period.toTime}-${period.subject}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, period);
    });

    return Array.from(uniqueMap.values()).sort((a: any, b: any) =>
      String(a.fromTime).localeCompare(String(b.fromTime))
    );
  };

  const maxPeriods = Math.max(
    10,
    ...timetable.map((row) => getSortedPeriods(row).length),
  );
  const periodHeaders = timetable.length > 0 ? getSortedPeriods(timetable[0]) : [];
  const rowLabelWidth = 88;
  const periodCellWidth = 110;

  return (
    <SafeAreaView style={ttStyles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView nestedScrollEnabled contentContainerStyle={ttStyles.scrollContent}>
        <View style={[ttStyles.page, embedded && ttStyles.embeddedPage]}>
          <View style={ttStyles.pageHeader}>
            <View>
              <Text style={ttStyles.pageTitle}>Timetable</Text>
              <Text style={ttStyles.pageSubtitle}>
                {studentData?.name || '-'} | {studentData?.class_name || '-'} {studentData?.section || ''}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={ttStyles.centerState}>
              <ActivityIndicator size="large" color="#5A7488" />
              <Text style={ttStyles.stateText}>Loading timetable...</Text>
            </View>
          ) : timetable.length === 0 ? (
            <View style={ttStyles.centerState}>
              <Text style={ttStyles.stateText}>No timetable available.</Text>
            </View>
          ) : (
            <>
                 

              <View style={ttStyles.tableCard}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View
                      style={[
                        ttStyles.tableOuter,
                        {
                          minWidth: rowLabelWidth + periodCellWidth * maxPeriods,
                        },
                      ]}
                    >
                      <View style={ttStyles.headerRow}>
                        <View style={[ttStyles.cornerCell, { width: rowLabelWidth }]}>
                          <Text style={ttStyles.headerText}>Day</Text>
                        </View>
                        {Array.from({ length: maxPeriods }).map((_, index) => (
                          <View
                            key={`period-header-${index}`}
                            style={[ttStyles.periodHeaderCell, { width: periodCellWidth }]}
                          >
                            <Text style={ttStyles.periodHeaderNumber}>{`Period ${index + 1}`}</Text>
                            <Text style={ttStyles.periodHeaderTime} numberOfLines={2}>
                              {periodHeaders[index]
                                ? `${String(periodHeaders[index].fromTime || '').slice(0, 5)} - ${String(
                                    periodHeaders[index].toTime || ''
                                  ).slice(0, 5)}`
                                : ''}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {timetable.map((dayRow, dayIndex) => {
                        const periods = getSortedPeriods(dayRow);
                        const isLastRow = dayIndex === timetable.length - 1;

                        return (
                          <View key={dayRow.day} style={ttStyles.dataRow}>
                            <View
                              style={[
                                ttStyles.dayCell,
                                {
                                  width: rowLabelWidth,
                                  borderBottomWidth: isLastRow ? 0 : 1,
                                },
                              ]}
                            >
                              <Text style={ttStyles.dayText}>{dayRow.day}</Text>
                            </View>

                            {Array.from({ length: maxPeriods }).map((_, periodIndex) => {
                              const period = periods[periodIndex];
                              const isLastPeriod = periodIndex === maxPeriods - 1;

                              return (
                                <View
                                  key={`${dayRow.day}-${periodIndex}`}
                                  style={[
                                    ttStyles.subjectCell,
                                    {
                                      width: periodCellWidth,
                                      borderBottomWidth: isLastRow ? 0 : 1,
                                      borderRightWidth: isLastPeriod ? 0 : 1,
                                    },
                                  ]}
                                >
                                  <Text numberOfLines={2} style={ttStyles.subjectText}>
                                    {period ? period.subject : '--'}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentTimetable;

const ttStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F6F7',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  page: {
    gap: 16,
  },
  embeddedPage: {
    padding: 0,
  },
  pageHeader: {
    paddingHorizontal: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111111',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  centerState: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    color: '#555',
    fontSize: 14,
  },
  tableOuter: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignSelf: 'stretch',
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E4EA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 14,
  },
  classInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  classInfoBox: {
    flex: 1,
    minHeight: 74,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  classInfoValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  classInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A7488',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E1E4EA',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#6f8798',
  },
  cornerCell: {
    minHeight: 62,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    paddingHorizontal: 8,
  },
  periodHeaderCell: {
    minHeight: 62,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    paddingHorizontal: 8,
  },
  dataRow: {
    flexDirection: 'row',
  },
  dayCell: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A7488',
    textAlign: 'center',
  },
  subjectCell: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F2F2F2',
    textAlign: 'center',
  },
  periodHeaderNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F2F2F2',
    textAlign: 'center',
  },
  periodHeaderTime: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '600',
    color: '#EEF2F7',
    textAlign: 'center',
    lineHeight: 11,
  },
  subjectText: {
    fontSize: 11,
    color: '#111',
    textAlign: 'center',
    lineHeight: 15,
  },
});
