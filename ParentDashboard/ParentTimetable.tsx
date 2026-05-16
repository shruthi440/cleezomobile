import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { RootStackParamList } from '../types';
import { globalStyles as baseStyles } from '../inner';
import { createAppStyles } from '../App.styles';
import { ErrorContext } from '../ErrorContext';

const heroImage = require('../assets/StudentReport.png');

const ParentTimetable: React.FC<
  NativeStackScreenProps<RootStackParamList, 'ParentTimetable'>
  & { embedded?: boolean }
> = ({ embedded = false }) => {
  const [studentData, setStudentData] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useContext(ErrorContext);
  const { width, height } = useWindowDimensions();
  const phoneWidth = Math.min(Math.max(width - 24, 320), 390);
  const phoneHeight = Math.min(Math.max(height - 24, 720), 860);
  const appStyles = createAppStyles({ phoneWidth, phoneHeight });

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
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndexMap = new Map(daysOrder.map((day, index) => [day, index]));
  const parseTimeToMinutes = (value: string) => {
    const text = String(value || '').slice(0, 5);
    const [hour = '0', minute = '0'] = text.split(':');
    return Number(hour) * 60 + Number(minute);
  };
  const now = new Date();
  const currentDayName =
    daysOrder[now.getDay() === 0 ? 0 : Math.min(now.getDay() - 1, 5)] || 'Monday';
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const schedule = timetable
    .flatMap((row) =>
      getSortedPeriods(row).map((period: any) => ({
        day: row.day,
        dayIndex: dayIndexMap.get(row.day) ?? 99,
        subject: String(period.subject || '--'),
        fromTime: String(period.fromTime || '').slice(0, 5),
        toTime: String(period.toTime || '').slice(0, 5),
        startMinutes: parseTimeToMinutes(period.fromTime),
      }))
    )
    .sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      return a.startMinutes - b.startMinutes;
    });
  const nextClass =
    schedule.find((item) => item.day === currentDayName && item.startMinutes > currentMinutes) ||
    schedule.find((item) => item.dayIndex > (dayIndexMap.get(currentDayName) ?? 0)) ||
    schedule[0] ||
    null;
  const upcomingClass = nextClass
    ? schedule[schedule.indexOf(nextClass) + 1] ||
      schedule.find((item) => item.dayIndex > nextClass.dayIndex) ||
      null
    : null;

  const headerHeight = 62;
  const rowCount = Math.max(timetable.length, 1);
  const tableHeight = Math.max(headerHeight + rowCount * 78, 520);
  const embeddedHeight = tableHeight;
  const bodyHeight = Math.max(tableHeight - headerHeight, 0);
  const tableViewportHeight = Math.max(phoneHeight * 0.8, 560);

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={baseStyles.scrollView} nestedScrollEnabled>
        <View style={embedded ? [baseStyles.container, { padding: 0 }] : baseStyles.container}>
          <View
            style={[
              {
                height: embedded ? embeddedHeight : undefined,
                minHeight: embedded ? embeddedHeight : undefined,
                overflow: embedded ? 'hidden' : 'visible',
              },
            ]}
          >
           

            <View
              style={[
                baseStyles.gridContainer,
                {
                  marginTop: 0,
                  height: embedded ? '100%' : undefined,
                  minHeight: embedded ? embeddedHeight : tableHeight,
                  overflow: embedded ? 'hidden' : 'visible',
                  paddingBottom: 8,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#000" />
              ) : timetable.length === 0 ? (
                <Text style={{ textAlign: 'center', padding: 20 }}>No timetable available.</Text>
              ) : (
                <View>
                  <View style={ttStyles.summaryRow}>
                    <View style={[ttStyles.summaryCard, ttStyles.summaryCardLeft]}>
                      <Text style={ttStyles.summaryLabel}>Next Class</Text>
                      <Text style={ttStyles.summaryTitle}>
                        {nextClass ? nextClass.subject : 'No class'}
                      </Text>
                      <Text style={ttStyles.summaryMeta}>
                        {nextClass
                          ? `${nextClass.day} • ${nextClass.fromTime} - ${nextClass.toTime}`
                          : 'No upcoming class found'}
                      </Text>
                    </View>

                    <View style={[ttStyles.summaryCard, ttStyles.summaryCardRight]}>
                      <Text style={ttStyles.summaryLabel}>Upcoming Class</Text>
                      <Text style={ttStyles.summaryTitle}>
                        {upcomingClass ? upcomingClass.subject : 'No class'}
                      </Text>
                      <Text style={ttStyles.summaryMeta}>
                        {upcomingClass
                          ? `${upcomingClass.day} • ${upcomingClass.fromTime} - ${upcomingClass.toTime}`
                          : 'No more classes'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: tableViewportHeight, overflow: 'hidden' }}>
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                      contentContainerStyle={{ paddingBottom: 12 }}
                    >
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View
                          style={[
                            ttStyles.tableOuter,
                            {
                              minWidth: rowLabelWidth + periodCellWidth * maxPeriods,
                              minHeight: tableHeight,
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
                            const rowHeight = bodyHeight / Math.max(timetable.length, 1);

                            return (
                            <View
                              key={dayRow.day}
                              style={[
                                ttStyles.dataRow,
                                {
                                  height: rowHeight,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  ttStyles.dayCell,
                                  {
                                    width: rowLabelWidth,
                                    flex: 1,
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
                                        flex: 1,
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
                </View>
              )}
            </View>

         
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentTimetable;

const ttStyles = StyleSheet.create({
  tableOuter: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
  },
  summaryRow: {
    flexDirection: 'row',
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
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontWeight: '700',
    color: '#222222',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#2B2B2B',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#5A7488',
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
    borderRightColor: '#ccc',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
    borderRightColor: '#ccc',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
