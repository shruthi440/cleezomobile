import React, { createContext, useState } from 'react';
// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [teacherUsername, setTeacherUsername] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [maxAttendance, setMaxAttendance] = useState(null);
  const [maxBehaviorReport, setMaxBehaviorReport] = useState({name: "None",
    percentage: 0,});
    const[maxActivityReport,setMaxActivityReport]=useState(null)
    const[maxAcademicReport,setMaxAcademicReport]=useState({ subject: '', percentage: 0 });

  return (
      <UserContext.Provider value={{ teacherUsername, setTeacherUsername ,
      studentUsername,setStudentUsername,
      maxAttendance, setMaxAttendance,
      maxBehaviorReport,setMaxBehaviorReport,
      maxAcademicReport,setMaxAcademicReport,
      maxActivityReport,setMaxActivityReport}}>
        {children}
    </UserContext.Provider>
  );
};


