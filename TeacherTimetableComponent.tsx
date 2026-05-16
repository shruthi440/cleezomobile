import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { globalStyles as styles } from './teacherStyles'; // Ensure this matches your style file name

const TeacherTimetableComponent = ({ data }: { data: any[] }) => {
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // 1. Group and Sort Logic
  const groupedByDay: any = data.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    if (Array.isArray(item.periods)) acc[item.day].push(...item.periods);
    else if (item.periods) acc[item.day].push(item.periods);
    return acc;
  }, {});

  const sortedData = daysOrder.map(day => {
    const dayPeriods = groupedByDay[day] || [];
    const uniquePeriods = dayPeriods.filter((v: any, i: number, a: any[]) => 
      a.findIndex(t => t.fromTime === v.fromTime && t.toTime === v.toTime) === i
    );
    return { day, periods: uniquePeriods.sort((a: any, b: any) => a.fromTime.localeCompare(b.fromTime)) };
  });

  const maxPeriodsCount = Math.max(...sortedData.map(d => d.periods.length), 1);

  // 2. CRITICAL: Calculate total width to force horizontal scrolling
  // Day(100) + Periods(Class 70 + From 70 + To 70 = 210 per period)
  const totalWidth = 100 + (maxPeriodsCount * 210);

  return (
    <ScrollView 
      horizontal 
      nestedScrollEnabled={true} // Needed for Android
      showsHorizontalScrollIndicator={true}
      style={{ marginTop: 15, borderTopWidth: 1, borderColor: '#000' }}
    >
      {/* 3. Apply the calculated width to the inner container */}
      <View style={{ width: totalWidth }}>
        
        {/* Header Row */}
        <View style={[styles.teacherTableHeader, { flexDirection: 'row' }]}>
          <Text style={[styles.teacherHeaderCell, { width: 100 }]}>Day</Text>
          {[...Array(maxPeriodsCount)].map((_, i) => (
            <React.Fragment key={i}>
              <Text style={[styles.teacherHeaderCellSmall, { width: 70 }]}>Class</Text>
              <Text style={[styles.teacherHeaderCellMed, { width: 70 }]}>From</Text>
              <Text style={[styles.teacherHeaderCellMed, { width: 70 }]}>To</Text>
            </React.Fragment>
          ))}
        </View>

        {/* Data Rows */}
        {sortedData.map(({ day, periods }) => (
          <View key={day} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
            <Text style={[styles.teacherDataCellDay, { width: 100, textAlign: 'center' }]}>{day}</Text>
            {periods.map((p: any, i: number) => (
              <React.Fragment key={i}>
                <Text style={[styles.teacherDataCell, { width: 70, textAlign: 'center' }]}>{p.class_id || '--'}</Text>
                <Text style={[styles.teacherDataCell, { width: 70, textAlign: 'center' }]}>{p.fromTime?.slice(0, 5) || '--'}</Text>
                <Text style={[styles.teacherDataCell, { width: 70, textAlign: 'center' }]}>{p.toTime?.slice(0, 5) || '--'}</Text>
              </React.Fragment>
            ))}
            {/* Fill empty cells */}
            {[...Array(maxPeriodsCount - periods.length)].map((_, idx) => (
              <React.Fragment key={`empty-${idx}`}>
                <Text style={{ width: 70, borderLeftWidth: 1, borderColor: '#000' }} />
                <Text style={{ width: 70, borderLeftWidth: 1, borderColor: '#000' }} />
                <Text style={{ width: 70, borderLeftWidth: 1, borderColor: '#000' }} />
              </React.Fragment>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default TeacherTimetableComponent;
