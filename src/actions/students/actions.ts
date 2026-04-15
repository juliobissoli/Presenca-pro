import { Student } from "@/src/types";
import { supabase } from "@/src/lib/supabase";

export interface GetStudentsParams {
  classId: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface GetStudentsResponse {
  data: Student[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getStudentsByClass(params: GetStudentsParams): Promise<GetStudentsResponse> {
  const { classId, page = 1, pageSize = 10, query = "" } = params;

  let supabaseQuery = supabase
    .from("students")
    .select("*", { count: "exact" })
    .eq("class_id", classId);

  if (query) {
    supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, count, error } = await supabaseQuery
    .range(start, end)
    .order("name", { ascending: true });

  if (error) throw error;

  const students: Student[] = (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    classId: item.class_id,
  }));

  return {
    data: students,
    total: count || 0,
    page,
    pageSize,
  };
}

export async function createStudent(data: Omit<Student, "id">): Promise<Student> {
  const { data: newStudent, error } = await supabase
    .from("students")
    .insert({
      name: data.name,
      class_id: data.classId,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(error.message || "Erro ao criar aluno no banco de dados");
  }

  return {
    id: newStudent.id,
    name: newStudent.name,
    classId: newStudent.class_id,
  };
}

export async function updateStudent(id: string, classId: string, data: Partial<Omit<Student, "id" | "classId">>): Promise<Student> {
  const { data: updatedStudent, error } = await supabase
    .from("students")
    .update({
      name: data.name,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase update error:", error);
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(error.message || "Erro ao atualizar aluno no banco de dados");
  }

  return {
    id: updatedStudent.id,
    name: updatedStudent.name,
    classId: updatedStudent.class_id,
  };
}

export async function deleteStudent(id: string, classId: string): Promise<void> {
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase delete error:", error);
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(error.message || "Erro ao excluir aluno no banco de dados");
  }
}

export interface GetStudentAttendanceSummaryParams {
  studentId: string;
  classId: string;
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
}

export interface StudentAttendanceEntry {
  date: string;
  isPresent: boolean;
  observation?: string;
}

export interface GetStudentAttendanceSummaryResponse {
  totalPresent: number;
  totalAbsent: number;
  entries: StudentAttendanceEntry[];
  totalEntries: number;
  page: number;
  pageSize: number;
}

export async function getStudentAttendanceSummary(
  params: GetStudentAttendanceSummaryParams,
): Promise<GetStudentAttendanceSummaryResponse> {
  const { studentId, classId, startDate, endDate, page = 1, pageSize = 10 } = params;

  // Step 1: Get all attendance records for the class in the date range
  const { data: records, error: recordsError } = await supabase
    .from("attendance_records")
    .select("id, date")
    .eq("class_id", classId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (recordsError) {
    console.error("Supabase fetch records error:", recordsError);
    throw new Error(recordsError.message || "Erro ao buscar registros de presença");
  }

  if (!records || records.length === 0) {
    return { totalPresent: 0, totalAbsent: 0, entries: [], totalEntries: 0, page, pageSize };
  }

  const recordIds = records.map((r: any) => r.id);
  const recordDateMap = new Map<string, string>(records.map((r: any) => [r.id, r.date]));

  // Step 2: Get all entries for this student in those records
  const { data: entries, error: entriesError } = await supabase
    .from("attendance_entries")
    .select("id, record_id, is_present, observation")
    .eq("student_id", studentId)
    .in("record_id", recordIds);

  if (entriesError) {
    console.error("Supabase fetch entries error:", entriesError);
    throw new Error(entriesError.message || "Erro ao buscar marcações do aluno");
  }

  const allEntries = (entries || [])
    .map((e: any) => ({
      isPresent: e.is_present as boolean,
      observation: (e.observation as string) || undefined,
      date: recordDateMap.get(e.record_id) || "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPresent = allEntries.filter((e) => e.isPresent).length;
  const totalAbsent = allEntries.filter((e) => !e.isPresent).length;
  const totalEntries = allEntries.length;

  const start = (page - 1) * pageSize;
  const pagedEntries: StudentAttendanceEntry[] = allEntries
    .slice(start, start + pageSize)
    .map((e) => ({ date: e.date, isPresent: e.isPresent, observation: e.observation }));

  return { totalPresent, totalAbsent, entries: pagedEntries, totalEntries, page, pageSize };
}
