// NextClassContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NextClass = {
  class_id?: string;
  subject?: string;
  fromTime?: string;
  toTime?: string;
  day?: string;
} | null;

type NextClassContextType = {
  nextClass: NextClass;
  fullTimetable: any[]; // store full timetable
  setNextClass: React.Dispatch<React.SetStateAction<NextClass>>;
  refreshNextClass: () => Promise<void>;
};

export const buildTeacherDayPeriods = (data: any[]) => {
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

  return daysOrder
    .map(day => {
      const dayPeriods = groupedByDay[day] || [];

      const uniquePeriods = dayPeriods.filter(
        (v: any, i: number, a: any[]) =>
          a.findIndex(t => t.fromTime === v.fromTime && t.toTime === v.toTime) === i
      );

      return {
        day,
        periods: uniquePeriods.sort((a: any, b: any) => a.fromTime.localeCompare(b.fromTime)),
      };
    })
    .filter(d => d.periods.length > 0);
};

const NextClassContext = createContext<NextClassContextType | undefined>(undefined);

export const NextClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nextClass, setNextClass] = useState<NextClass>(null);
  const [fullTimetable, setFullTimetable] = useState<any[]>([]);

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
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
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

  const refreshNextClass = async () => {
    try {
      const schoolCode = await AsyncStorage.getItem('schoolCode');
      const username = await AsyncStorage.getItem('username');
      if (!schoolCode || !username) return;

      const res = await fetch(
        `http://162.215.210.38:3010/api/teacher-timetable-by-username?username=${username}&schoolCode=${schoolCode}`
      );
      const data = await res.json();

      if (Array.isArray(data.teacherTimetable)) {
        setFullTimetable(data.teacherTimetable); // store full timetable

        const upcoming = findNextClass(data.teacherTimetable);
        setNextClass(upcoming || null);
      }
    } catch (e) {
      console.error('Failed to load timetable', e);
    }
  };

  useEffect(() => {
    refreshNextClass();
  }, []);

  return (
    <NextClassContext.Provider value={{ nextClass, fullTimetable, setNextClass, refreshNextClass }}>
      {children}
    </NextClassContext.Provider>
  );
};

export const useNextClass = () => {
  const context = useContext(NextClassContext);
  if (!context) throw new Error('useNextClass must be used within NextClassProvider');
  return context;
};
