import React, { FC, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

/* ======================= */
/* ===== INTERFACES ===== */
/* ======================= */

interface Teacher {
  teacher_id: number;
  teacher_name: string;
  email?: string;
}

interface Attendance {
  id: number;
  username: string;
  date: string;
  status: string;
  entry_time?: string;
  exit_time?: string;
}

interface MonthlySalaryData {
  base_salary: number;
  hra: number;
  pf: number;
  professional_tax: number;
  mediclaim: number;
  deductions: number;
  final_salary: number;
  status: string;
  salary_type: string;
}

/* ======================= */
/* ===== COMPONENT ====== */
/* ======================= */

const TeacherSalary: FC = () => {
  console.log("🟢 TeacherSalaryTable1 Screen Loaded");

  const [teacherData, setTeacherData] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] =
    useState<number | null>(null);

  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [monthlySalaryData, setMonthlySalaryData] =
    useState<MonthlySalaryData | null>(null);

  const [presentDays, setPresentDays] = useState(0);
  const [halfDays, setHalfDays] = useState(0);
  const [lateHours, setLateHours] = useState(0);

  const [loading, setLoading] = useState(false);

  /* ======================= */
  /* ===== API CALLS ====== */
  /* ======================= */

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    console.log("📡 Fetching teacher list...");
    try {
      const schoolCode = "NOVA"; // 🔴 replace with AsyncStorage if needed
      const res = await fetch(
        `https://cleezoclass.com:4000/api/teach?schoolCode=${schoolCode}`
      );
      const data: Teacher[] = await res.json();

      console.log("✅ Teachers received:", data);
      setTeacherData(data);
    } catch (err) {
      console.error("❌ Failed to fetch teachers:", err);
      Alert.alert("Error", "Unable to load teachers");
    }
  };

  const fetchSalaryAndAttendance = async (teacherId: number) => {
    console.log("📡 Fetching salary + attendance for:", teacherId);
    setLoading(true);

    try {
      const schoolCode = "NOVA";

      /* -------- Salary -------- */
      const salaryRes = await fetch(
        `https://cleezoclass.com:4000/api/salary/${teacherId}?schoolCode=${schoolCode}`
      );
      const salaryData = await salaryRes.json();

      console.log("💰 Salary Response:", salaryData);

      /* -------- Attendance -------- */
      const attendanceRes = await fetch(
        `https://cleezoclass.com:4000/api/payroll/${teacherId}?schoolCode=${schoolCode}`
      );
      const attendance: Attendance[] = await attendanceRes.json();

      console.log("📊 Attendance Records:", attendance);

      /* ======================= */
      /* ===== CALCULATIONS ==== */
      /* ======================= */

      let present = 0;
      let half = 0;
      let lateMinutes = 0;

      const officeTime = new Date("1970-01-01T09:00:00");

      attendance.forEach((a) => {
        if (a.status.toLowerCase() === "present") {
          present++;

          if (a.entry_time && a.exit_time) {
            const inTime = new Date(`1970-01-01T${a.entry_time}`);
            const outTime = new Date(`1970-01-01T${a.exit_time}`);
            const workedHours =
              (outTime.getTime() - inTime.getTime()) / 3600000;

            if (workedHours < 5) {
              half++;
            }

            if (inTime > officeTime) {
              lateMinutes +=
                (inTime.getTime() - officeTime.getTime()) / 60000;
            }
          }
        }
      });

      const lateHoursCalculated = lateMinutes / 60;

      console.log("📌 Present Days:", present);
      console.log("📌 Half Days:", half);
      console.log("📌 Late Hours:", lateHoursCalculated);

      /* -------- Final Salary -------- */
      const base = Number(salaryData.salary_amount || 0);
      const deductions =
        Number(salaryData.pf || 0) +
        Number(salaryData.professional_tax || 0) +
        Number(salaryData.mediclaim || 0);

      const finalSalary = base - deductions;

      console.log("🧮 Final Salary Calculation:", {
        base,
        deductions,
        finalSalary,
      });

      setMonthlySalaryData({
        base_salary: base,
        hra: Number(salaryData.hra || 0),
        pf: Number(salaryData.pf || 0),
        professional_tax: Number(salaryData.professional_tax || 0),
        mediclaim: Number(salaryData.mediclaim || 0),
        deductions,
        final_salary: finalSalary,
        status: salaryData.status || "pending",
        salary_type: salaryData.salary_type || "monthly",
      });

      setAttendanceData(attendance);
      setPresentDays(present);
      setHalfDays(half);
      setLateHours(lateHoursCalculated);
    } catch (err) {
      console.error("❌ Payroll fetch failed:", err);
      Alert.alert("Error", "Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Teacher Salary (Payroll)</Text>

      <Picker
        selectedValue={selectedTeacherId}
        onValueChange={(value) => {
          console.log("👤 Teacher selected:", value);
          setSelectedTeacherId(value);
          if (value) fetchSalaryAndAttendance(value);
        }}
      >
        <Picker.Item label="Select Teacher" value={null} />
        {teacherData.map((t) => (
          <Picker.Item
            key={t.teacher_id}
            label={t.teacher_name}
            value={t.teacher_id}
          />
        ))}
      </Picker>

      {loading && <ActivityIndicator size="large" />}

      {monthlySalaryData && (
        <View style={styles.card}>
          <Text>Base Salary: ₹{monthlySalaryData.base_salary}</Text>
          <Text>PF: ₹{monthlySalaryData.pf}</Text>
          <Text>Professional Tax: ₹{monthlySalaryData.professional_tax}</Text>
          <Text>Mediclaim: ₹{monthlySalaryData.mediclaim}</Text>
          <Text style={styles.final}>
            Final Salary: ₹{monthlySalaryData.final_salary}
          </Text>

          <Text>Present Days: {presentDays}</Text>
          <Text>Half Days: {halfDays}</Text>
          <Text>Late Hours: {lateHours.toFixed(2)}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default TeacherSalary;

/* ======================= */
/* ===== STYLES ========= */
/* ======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  card: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  final: {
    fontWeight: "bold",
    marginTop: 8,
  },
});
