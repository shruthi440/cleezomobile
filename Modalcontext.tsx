import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TeacherTimetableContextType {
  teacherTimetable: any[];
  teacherName: string;
  loading: boolean;
  loadTeacherTimetable: () => Promise<void>;
}

// Initialize with undefined
export const TeacherTimetableContext = createContext<TeacherTimetableContextType | undefined>(undefined);

export const TeacherTimetableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teacherTimetable, setTeacherTimetable] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const loadTeacherTimetable = async () => {
    setLoading(true);
    try {
      const schoolCode = await AsyncStorage.getItem('schoolCode');
      const username = await AsyncStorage.getItem('username');
      if (!schoolCode || !username) return;

      const response = await fetch(`http://162.215.210.38:3010/api/teacher-timetable-by-username?username=${username}&schoolCode=${schoolCode}`);
      const data = await response.json();

      if (data.teacherTimetable) {
        setTeacherTimetable(data.teacherTimetable);
        setTeacherName(data.teacher_name || 'My Timetable');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeacherTimetable(); }, []);

  return (
    <TeacherTimetableContext.Provider value={{ teacherTimetable, teacherName, loading, loadTeacherTimetable }}>
      {children}
    </TeacherTimetableContext.Provider>
  );
};