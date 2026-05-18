import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorContext } from '../ErrorContext';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ParentAcademic'>;
type AcademicViewProps = Props & { embedded?: boolean };

interface AcademicSubject {
  name?: string;
  subject?: string;
  subject_name?: string;
  title?: string;
  label?: string;
  FA?: Array<number | string | null>;
  SA?: Array<number | string | null>;
  tests?: Record<
    string,
    { obtained?: number | string | null; max?: number | string | null }
  >;
}

interface TermRow {
  key: string;
  label: string;
}

interface TrendPoint {
  key: string;
  label: string;
  value: number | null;
}

const getSubjectDisplayName = (subject: AcademicSubject, index: number) =>
  subject.name ||
  subject.subject ||
  subject.subject_name ||
  subject.title ||
  subject.label ||
  `Subject ${index + 1}`;

const fallbackTermRows: TermRow[] = [
  { label: 'FA1', key: 'FA1' },
  { label: 'FA2', key: 'FA2' },
  { label: 'SA1', key: 'SA1' },
  { label: 'FA3', key: 'FA3' },
  { label: 'FA4', key: 'FA4' },
  { label: 'SA2', key: 'SA2' },
];

const buildTermRows = (testTypes: any[]): TermRow[] => {
  if (!Array.isArray(testTypes) || testTypes.length === 0) {
    return fallbackTermRows;
  }

  return testTypes
    .filter((row: any) => row?.key && row?.label)
    .map((row: any) => ({ key: row.key, label: row.label }));
};

const getTermMark = (subject: AcademicSubject, rowKey: string) => {
  const testEntry = subject?.tests?.[rowKey];
  if (testEntry?.obtained !== null && testEntry?.obtained !== undefined) {
    return testEntry.obtained;
  }

  const match = String(rowKey || '')
    .toUpperCase()
    .match(/^(FA|SA)(\d+)$/);
  if (!match) return '-';

  const type = match[1];
  const index = Number(match[2]) - 1;
  const legacyMark = type === 'FA' ? subject?.FA?.[index] : subject?.SA?.[index];
  return legacyMark ?? '-';
};

const getTermMax = (subject: AcademicSubject, rowKey: string) => {
  const testEntry = subject?.tests?.[rowKey];
  if (testEntry?.max !== null && testEntry?.max !== undefined) {
    return Number(testEntry.max) || 0;
  }

  const match = String(rowKey || '')
    .toUpperCase()
    .match(/^(FA|SA)(\d+)$/);
  if (!match) return 0;

  return match[1] === 'FA' ? 20 : 80;
};

const buildTrendPoints = (
  performance: AcademicSubject[],
  termRows: TermRow[],
): TrendPoint[] =>
  termRows.map((term) => {
    let obtained = 0;
    let total = 0;

    performance.forEach((subject) => {
      const mark = getTermMark(subject, term.key);
      const max = getTermMax(subject, term.key);
      const numericMark = Number(mark);

      if (
        mark !== '-' &&
        mark !== null &&
        mark !== undefined &&
        !Number.isNaN(numericMark) &&
        max > 0
      ) {
        obtained += numericMark;
        total += max;
      }
    });

    return {
      key: term.key,
      label: term.label,
      value: total > 0 ? Number(((obtained / total) * 100).toFixed(2)) : null,
    };
  });

const buildTrendSummary = (points: TrendPoint[]) => {
  const validPoints = points.filter(point => point.value !== null);
  const transitions = [];

  for (let i = 1; i < validPoints.length; i += 1) {
    const prev = validPoints[i - 1];
    const current = validPoints[i];
    const diff = Number(((current.value ?? 0) - (prev.value ?? 0)).toFixed(2));
    transitions.push({
      from: prev.label,
      to: current.label,
      diff,
      improved: diff > 0,
      status: diff > 0 ? 'Improved' : diff < 0 ? 'Declined' : 'No Change',
    });
  }

  const overallDiff =
    validPoints.length >= 2
      ? Number(
          (
            (validPoints[validPoints.length - 1].value ?? 0) -
            (validPoints[0].value ?? 0)
          ).toFixed(2),
        )
      : null;

  return {
    validPoints,
    transitions,
    overallDiff,
  };
};

const getSubjectTrendKey = (subject: AcademicSubject, index: number) =>
  String(
    subject.name ||
      subject.subject ||
      subject.subject_name ||
      subject.title ||
      subject.label ||
      `Subject ${index + 1}`,
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

const computeAcademicSummary = (
  performance: AcademicSubject[],
  testTypes: any[],
) => {
  if (!performance.length) return { grade: '-', percentage: '0.00' };
  const termRows = buildTermRows(testTypes);

  let obtained = 0;
  let total = 0;

  performance.forEach(subj => {
    termRows.forEach(row => {
      const mark = getTermMark(subj, row.key);
      const maxMark = getTermMax(subj, row.key);
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

const computeTestSummary = (
  performance: AcademicSubject[],
  rowKey: string,
  testTypes: any[],
) => {
  if (!performance.length || !rowKey) return { grade: '-', percentage: '0.00' };
  const termRows = buildTermRows(testTypes);

  const matchedRow = termRows.find((row: any) => row.key === rowKey);
  if (!matchedRow) return { grade: '-', percentage: '0.00' };

  let obtained = 0;
  let total = 0;

  performance.forEach((subj) => {
    const mark = getTermMark(subj, matchedRow.key);
    const maxMark = getTermMax(subj, matchedRow.key);
    const numericMark = Number(mark);
    const numericMax = Number(maxMark);

    if (
      mark !== '-' &&
      mark !== null &&
      mark !== undefined &&
      !Number.isNaN(numericMark) &&
      numericMax > 0
    ) {
      obtained += numericMark;
      total += numericMax;
    }
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

const ParentAcademic: React.FC<AcademicViewProps> = ({
  navigation,
  embedded = false,
}) => {
  const { height, width } = useWindowDimensions();
  const [studentData, setStudentData] = useState<Record<string, any> | null>(
    null,
  );
  const [performance, setPerformance] = useState<AcademicSubject[]>([]);
  const [testTypes, setTestTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendVisible, setTrendVisible] = useState(false);
  const [trendSubjectKey, setTrendSubjectKey] = useState('__all__');
  const { showError } = React.useContext(ErrorContext);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const keys = [
          'studentId',
          'username',
          'name',
          'class_name',
          'section',
          'schoolCode',
        ];
        const stores = await AsyncStorage.multiGet(keys);
        const data: Record<string, any> = {};
        stores.forEach(([key, value]) => {
          if (value) data[key] = value;
        });
        setStudentData(data);
      } catch {
        showError('Data Error', 'Failed to load student information.');
      }
    };

    loadStudentData();
  }, [showError]);

  useEffect(() => {
    let isMounted = true;

    const fetchPerformance = async () => {
      setLoading(true);
      try {
        if (
          !studentData?.name ||
          !studentData?.class_name ||
          !studentData?.section
        ) {
          setPerformance([]);
          setTestTypes([]);
          return;
        }

        const storedSchoolCode = await AsyncStorage.getItem('schoolCode');
        const schoolCode = studentData?.schoolCode || storedSchoolCode || '';

        if (!schoolCode) {
          setPerformance([]);
          setTestTypes([]);
          return;
        }

        const res = await axios.post(
          'https://cleezoclass.com:4000/api/overall/academic-performance',
          {
            name: studentData.name,
            class_name: studentData.class_name,
            section: studentData.section,
            schoolCode,
          },
        );

        if (!isMounted) return;

        if (Array.isArray(res.data)) {
          setPerformance(res.data || []);
          setTestTypes([]);
        } else {
          setPerformance(
            Array.isArray(res.data?.performance) ? res.data.performance : [],
          );
          setTestTypes(
            Array.isArray(res.data?.testTypes) ? res.data.testTypes : [],
          );
        }
      } catch {
        if (isMounted) {
          showError(
            'Academic Performance Error',
            'Unable to load academic data.',
          );
          setPerformance([]);
          setTestTypes([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPerformance();
    return () => {
      isMounted = false;
    };
  }, [
    studentData?.name,
    studentData?.class_name,
    studentData?.section,
    studentData?.schoolCode,
    showError,
  ]);

  const summary = computeAcademicSummary(performance, testTypes);
  const termRowsForSummary = (testTypes || []).length
    ? testTypes
        .filter((row: any) => row?.key && row?.label)
        .map((row: any) => ({ key: row.key, label: row.label }))
    : [
        { label: 'FA1', key: 'FA1' },
        { label: 'FA2', key: 'FA2' },
        { label: 'SA1', key: 'SA1' },
        { label: 'FA3', key: 'FA3' },
        { label: 'FA4', key: 'FA4' },
        { label: 'SA2', key: 'SA2' },
      ];
  const previousTestRow = termRowsForSummary[termRowsForSummary.length - 1];
  const previousTestSummary = computeTestSummary(performance, previousTestRow?.key, testTypes);
  const subjectOptions = useMemo(
    () =>
      performance.map((subject, index) => ({
        key: getSubjectTrendKey(subject, index),
        label: getSubjectDisplayName(subject, index),
      })),
    [performance],
  );
  const selectedSubjectRow = useMemo(() => {
    if (trendSubjectKey === '__all__') return null;
    const matchedIndex = performance.findIndex(
      (subject, index) => getSubjectTrendKey(subject, index) === trendSubjectKey,
    );
    return matchedIndex >= 0 ? performance[matchedIndex] : null;
  }, [performance, trendSubjectKey]);
  const activeTrend = useMemo(() => {
    const sourceRows = selectedSubjectRow ? [selectedSubjectRow] : performance;
    return buildTrendSummary(buildTrendPoints(sourceRows, termRowsForSummary));
  }, [performance, selectedSubjectRow, termRowsForSummary]);
  const chartPoints = activeTrend.validPoints;
  const chartLabels = chartPoints.map(point => point.label);
  const chartData = chartPoints.map(point => point.value ?? 0);
  const chartWidth = Math.max(width - 48, chartPoints.length * 72);
  const activeTrendTitle = selectedSubjectRow
    ? getSubjectDisplayName(
        selectedSubjectRow,
        performance.findIndex((subject) => subject === selectedSubjectRow),
      )
    : 'All Subjects';

  const getDisplayMark = (subj: AcademicSubject, row: any) => {
    const testEntry = subj?.tests?.[row?.key];
    if (testEntry?.obtained !== null && testEntry?.obtained !== undefined) {
      return testEntry.obtained;
    }

    const match = String(row?.key || '')
      .toUpperCase()
      .match(/^(FA|SA)(\d+)$/);
    if (!match) return '-';
    const type = match[1];
    const index = Number(match[2]) - 1;
    const mark = type === 'FA' ? subj?.FA?.[index] : subj?.SA?.[index];
    return mark ?? '-';
  };

  const subjectListHeight = Math.max(
    260,
    Math.min(height * 0.5, embedded ? 380 : 460),
  );

  if (loading || !studentData) {
    return (
      <View style={embedded ? styles.embeddedShell : styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Loading academic data...</Text>
        </View>
      </View>
    );
  }

  const content = (
    <View style={embedded ? styles.embeddedContent : styles.content}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerLeftColumn}>
          <Text style={styles.title}>Academic</Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {studentData?.name || '-'} {studentData?.class_name || ''}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRowTop}>
        <View style={[styles.summaryCardTop, styles.summaryCardOverall, styles.summaryCardLeft]}>
          <Text style={styles.summaryLabelPlain}>Overall</Text>
          <Text style={styles.gradeCompact}>{summary.grade}</Text>
          <View style={styles.summaryPercentRow}>
            <Text style={styles.percentCompact}>{summary.percentage}%</Text>
            <TouchableOpacity
              style={[
                styles.graphBtn,
                chartPoints.length < 2 && styles.graphBtnDisabled,
              ]}
              onPress={() => setTrendVisible(true)}
              disabled={chartPoints.length < 2}
            >
              <Text style={styles.graphBtnText}>Graph</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.summaryCardTop, styles.summaryCardPrevious, styles.summaryCardRight]}>
          <Text style={styles.summaryLabelPlain}>Previous Test</Text>
          <Text style={styles.gradeCompact}>{previousTestSummary.grade}</Text>
          <Text style={styles.percentCompact}>
            {previousTestRow?.label || 'Last test'}
          </Text>
        </View>
      </View>

      {!embedded ? (
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack?.()}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {performance.length === 0 ? (
        <Text style={styles.emptyText}>No academic data.</Text>
      ) : (
        <View
          style={[
            styles.subjectsPanel,
            embedded && styles.embeddedSubjectsPanel,
            { maxHeight: subjectListHeight },
          ]}
        >
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.subjectsScrollContent}
          >
            {performance.map((subject, index) => (
              <View
                key={`${subject.name || 'subj'}-${index}`}
                style={styles.subjectCard}
              >
                <Text style={styles.subjectTitle}>
                  {getSubjectDisplayName(subject, index)}
                </Text>
                <View style={styles.rowHeader}>
                  {termRowsForSummary.map((row: any) => (
                    <Text key={row.key} style={styles.cellHeader}>
                      {row.label}
                    </Text>
                  ))}
                </View>
                <View style={styles.rowData}>
                  {termRowsForSummary.map((row: any) => (
                    <View key={row.key} style={styles.cell}>
                      <Text style={styles.cellText}>
                        {String(getDisplayMark(subject, row))}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <Modal
        visible={trendVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTrendVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.trendModal}>
            <View style={styles.trendModalHeader}>
              <View style={styles.trendModalHeaderText}>
                <Text style={styles.trendModalTitle}>Study Graph</Text>
                <Text style={styles.trendModalSubtitle}>
                  {studentData?.name || '-'} {studentData?.class_name || ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.trendCloseBtn}
                onPress={() => setTrendVisible(false)}
              >
                <Text style={styles.trendCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.trendModalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.trendSelectorWrap}>
                <Text style={styles.trendSelectorLabel}>Subject</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendSelectorChips}
                >
                  <TouchableOpacity
                    style={[
                      styles.trendChip,
                      trendSubjectKey === '__all__' && styles.trendChipActive,
                    ]}
                    onPress={() => setTrendSubjectKey('__all__')}
                  >
                    <Text
                      style={[
                        styles.trendChipText,
                        trendSubjectKey === '__all__' && styles.trendChipTextActive,
                      ]}
                    >
                      All Subjects
                    </Text>
                  </TouchableOpacity>

                  {subjectOptions.map((subject) => (
                    <TouchableOpacity
                      key={subject.key}
                      style={[
                        styles.trendChip,
                        trendSubjectKey === subject.key && styles.trendChipActive,
                      ]}
                      onPress={() => setTrendSubjectKey(subject.key)}
                    >
                      <Text
                        style={[
                          styles.trendChipText,
                          trendSubjectKey === subject.key &&
                            styles.trendChipTextActive,
                        ]}
                      >
                        {subject.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {chartPoints.length < 2 ? (
                <View style={styles.trendEmptyState}>
                  <Text style={styles.trendEmptyTitle}>Not enough test data</Text>
                  <Text style={styles.trendEmptyText}>
                    Add at least two test records to display the graph.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.trendActiveTitleRow}>
                    <Text style={styles.trendActiveTitle}>{activeTrendTitle}</Text>
                    {activeTrend.overallDiff !== null ? (
                      <Text
                        style={[
                          styles.trendOverallDiffValue,
                          activeTrend.overallDiff > 0
                            ? styles.trendStatDiffUp
                            : activeTrend.overallDiff < 0
                            ? styles.trendStatDiffDown
                            : styles.trendStatDiffFlat,
                        ]}
                      >
                        {activeTrend.overallDiff > 0 ? '+' : ''}
                        {activeTrend.overallDiff}%
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.trendChartWrap}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <LineChart
                        data={{
                          labels: chartLabels,
                          datasets: [
                            {
                              data: chartData,
                              color: opacity => `rgba(239, 101, 116, ${opacity})`,
                              strokeWidth: 3,
                            },
                          ],
                        }}
                        width={chartWidth}
                        height={240}
                        yAxisSuffix="%"
                        fromZero
                        withDots
                        withInnerLines={false}
                        withOuterLines
                        segments={4}
                        bezier
                        chartConfig={{
                          backgroundColor: '#ffffff',
                          backgroundGradientFrom: '#ffffff',
                          backgroundGradientTo: '#ffffff',
                          decimalPlaces: 1,
                          color: opacity => `rgba(239, 101, 116, ${opacity})`,
                          labelColor: () => '#667085',
                          propsForDots: {
                            r: '4',
                            strokeWidth: '2',
                            stroke: '#ef6574',
                          },
                          propsForBackgroundLines: {
                            stroke: '#e5e7eb',
                            strokeDasharray: '',
                          },
                        }}
                        style={styles.trendChart}
                      />
                    </ScrollView>
                  </View>

                  <View style={styles.trendTransitions}>
                    {activeTrend.transitions.map((item: any) => (
                      <Text
                        key={`${item.from}-${item.to}`}
                        style={[
                          styles.trendTransition,
                          item.improved
                            ? styles.trendTransitionUp
                            : item.diff < 0
                            ? styles.trendTransitionDown
                            : styles.trendTransitionFlat,
                        ]}
                      >
                        {item.from} to {item.to}: {item.status} (
                        {item.diff > 0 ? '+' : ''}
                        {item.diff}%)
                      </Text>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  return embedded ? (
    <View style={styles.embeddedCard}>{content}</View>
  ) : (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F6F7' },
  content: { flex: 1, padding: 16, paddingBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeftColumn: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  backRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
  },
  backBtn: {
    backgroundColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },
  embeddedShell: { padding: 0 },
  embeddedHeader: { marginBottom: 12 },
  embeddedTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  embeddedCard: { marginHorizontal: 0 },
  embeddedContent: { flex: 1, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 18,
    marginBottom: 16,
  },
  summaryLabelPlain: { fontSize: 12, color: '#666', fontWeight: '700' },
  summaryLabel: { fontSize: 12, color: '#666', fontWeight: '700' },
  grade: { fontSize: 40, fontWeight: '800', color: '#111', marginTop: 8 },
  percent: { fontSize: 16, color: '#444', marginTop: 4 },
  gradeCompact: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111',
    marginTop: 4,
    textAlign: 'left',
  },
  percentCompact: { fontSize: 14, color: '#444', marginTop: 2, textAlign: 'left' },
  summaryPercentRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  graphBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  graphBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  graphBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  overallSummaryPlain: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom:10,
  },
  summaryRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  summaryCardTop: {
    flex: 1,
    minHeight: 108,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  summaryCardLeft: {
    marginRight: 8,
  },
  summaryCardOverall: {
    backgroundColor: '#D7E8C9',
  },
  summaryCardRight: {
    marginLeft: 8,
  },
  summaryCardPrevious: {
    backgroundColor: '#F2EE9E',
  },
  subjectsPanel: {
    backgroundColor: '#f6f6f7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f6f6f7',
    padding: 12,
    marginBottom: 12,
  },
  embeddedSubjectsPanel: {
    padding: 0,
  },
  subjectsScrollContent: {
    paddingBottom: 4,
  },
  subjectCard: {
    backgroundColor: '#f6f6f7',
    borderRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',   

    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    padding: 14,
    marginBottom: 12,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  rowHeader: { flexDirection: 'row', marginBottom: 8 },
  rowData: { flexDirection: 'row' },
  cellHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  cellText: { fontSize: 12, fontWeight: '700', color: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#555' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  trendModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  trendModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f3',
  },
  trendModalHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  trendModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  trendModalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  trendCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  trendCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  trendModalContent: {
    padding: 16,
    gap: 14,
  },
  trendSelectorWrap: {
    gap: 8,
  },
  trendSelectorLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475467',
  },
  trendSelectorChips: {
    gap: 8,
    paddingRight: 8,
  },
  trendChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f2f4f7',
    borderWidth: 1,
    borderColor: '#e4e7ec',
  },
  trendChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  trendChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },
  trendChipTextActive: {
    color: '#fff',
  },
  trendActiveTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  trendActiveTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  trendEmptyState: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  trendEmptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendChartWrap: {
    borderRadius: 16,
    backgroundColor: '#fbfbfc',
    borderWidth: 1,
    borderColor: '#eef0f3',
    paddingVertical: 10,
  },
  trendChart: {
    borderRadius: 16,
  },
  trendTransitions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendTransition: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  trendTransitionUp: {
    color: '#16803c',
    backgroundColor: '#f1fcf5',
    borderColor: '#b7ebc6',
  },
  trendTransitionDown: {
    color: '#b42318',
    backgroundColor: '#fff4f6',
    borderColor: '#fdccd3',
  },
  trendTransitionFlat: {
    color: '#475467',
    backgroundColor: '#f8fafc',
    borderColor: '#d0d5dd',
  },
  trendStatDiffUp: {
    color: '#16803c',
  },
  trendStatDiffDown: {
    color: '#b42318',
  },
  trendStatDiffFlat: {
    color: '#667085',
  },
  trendOverallDiffValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ParentAcademic;
