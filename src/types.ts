export interface User {
  id: string;
  name: string;
  email: string;
  telegramChatId?: string;
  telegran_chat_id?: string;
  supabaseAccessToken?: string;
  supabaseRefreshToken?: string;
}

export interface Class {
  id: string;
  name: string;
  studentCount: number;
  userId: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  presentCount: number;
  absentCount: number;
  observationCount: number;
}

export interface AttendanceEntry {
  id: string;
  recordId: string;
  studentId: string;
  isPresent: boolean;
  observation?: string;
}

export interface ClassReminder {
  id: string;
  classId: string;
  userId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number;
  minute: number;
  isActive: boolean;
  createdAt: string;
}
