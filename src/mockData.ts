import { Class, Student, AttendanceRecord, AttendanceEntry, User } from "./types";

export const mockUser: User = {
  id: "user-1",
  name: "Professor Mateus",
  email: "mateus@exemplo.com",
};

export const mockClasses: Class[] = [
  { id: "class-1", name: "VV - Year 5th White", studentCount: 12, userId: "user-1" },
  { id: "class-2", name: "VV - Year 5th Red", studentCount: 10, userId: "user-1" },
  { id: "class-3", name: "Vitória - Year 6th", studentCount: 7, userId: "user-1" },
];

export const mockStudents: Record<string, Student[]> = {
  "class-1": [
    { id: "s1", name: "Mateus Fernandes", classId: "class-1" },
    { id: "s2", name: "Manuel da Silva", classId: "class-1" },
    { id: "s3", name: "Jorge Alcantara", classId: "class-1" },
    { id: "s4", name: "Natanael Lima", classId: "class-1" },
    { id: "s5", name: "Amaral Costa", classId: "class-1" },
  ],
};

export const mockAttendanceRecords: Record<string, AttendanceRecord[]> = {
  "class-1": [
    { id: "r1", classId: "class-1", date: "2026-02-02", presentCount: 3, absentCount: 2, observationCount: 0 },
    { id: "r2", classId: "class-1", date: "2026-02-01", presentCount: 4, absentCount: 1, observationCount: 1 },
  ],
};

export const mockAttendanceEntries: Record<string, AttendanceEntry[]> = {
  "r1": [
    { id: "e1", recordId: "r1", studentId: "s1", isPresent: true },
    { id: "e2", recordId: "r1", studentId: "s2", isPresent: false },
    { id: "e3", recordId: "r1", studentId: "s3", isPresent: true },
    { id: "e4", recordId: "r1", studentId: "s4", isPresent: false },
    { id: "e5", recordId: "r1", studentId: "s5", isPresent: true },
  ],
};
