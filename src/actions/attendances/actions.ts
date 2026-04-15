import { AttendanceRecord, AttendanceEntry } from "@/src/types";
import { supabase } from "@/src/lib/supabase";

export interface GetAttendancesParams {
  classId: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface GetAttendancesResponse {
  data: AttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAttendancesByClass(params: GetAttendancesParams): Promise<GetAttendancesResponse> {
  const { classId, page = 1, pageSize = 10, query = "" } = params;

  // In Supabase we'll need to calculate counts or use a view
  // For now, let's fetch records and their entries to calculate counts
  let supabaseQuery = supabase
    .from("attendance_records")
    .select(`
      *,
      attendance_entries(*)
    `, { count: "exact" })
    .eq("class_id", classId);

  if (query) {
    supabaseQuery = supabaseQuery.eq("date", query);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, count, error } = await supabaseQuery
    .range(start, end)
    .order("date", { ascending: false });

  if (error) throw error;

  const records: AttendanceRecord[] = (data || []).map((item: any) => {
    const entries = item.attendance_entries || [];
    return {
      id: item.id,
      classId: item.class_id,
      date: item.date,
      presentCount: entries.filter((e: any) => e.is_present).length,
      absentCount: entries.filter((e: any) => !e.is_present).length,
      observationCount: entries.filter((e: any) => e.observation).length,
    };
  });

  return {
    data: records,
    total: count || 0,
    page,
    pageSize,
  };
}

export async function getAttendanceEntries(recordId: string): Promise<AttendanceEntry[]> {
  const { data, error } = await supabase
    .from("attendance_entries")
    .select("*")
    .eq("record_id", recordId);

  if (error) {
    console.error("Supabase fetch entries error:", error);
    throw new Error(error.message || "Erro ao buscar entradas de presença");
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    recordId: item.record_id,
    studentId: item.student_id,
    isPresent: item.is_present,
    observation: item.observation,
  }));
}

export async function checkAttendanceExists(classId: string, date: string, excludeId?: string): Promise<boolean> {
  let query = supabase
    .from("attendance_records")
    .select("id")
    .eq("class_id", classId)
    .eq("date", date);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Supabase check existing record error:", error);
    return false;
  }

  return !!data;
}

export async function createAttendanceRecord(
  classId: string, 
  date: string, 
  entries: Omit<AttendanceEntry, "id" | "recordId">[]
): Promise<AttendanceRecord> {
  // 0. Check if a record already exists for this class and date
  const { data: existingRecord, error: checkError } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("class_id", classId)
    .eq("date", date)
    .maybeSingle();

  if (checkError) {
    console.error("Supabase check existing record error:", checkError);
  }

  // if (existingRecord) {
  //   throw new Error("Já existe um registro de presença para esta turma nesta data.");
  // }

  // 1. Create the record
  const { data: record, error: recordError } = await supabase
    .from("attendance_records")
    .insert({
      class_id: classId,
      date,
    })
    .select()
    .single();

  if (recordError) {
    console.error("Supabase insert record error:", recordError);
    if (recordError.code === 'PGRST301' || recordError.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(recordError.message || "Erro ao criar registro de presença");
  }

  // 2. Create the entries
  const entriesToInsert = entries.map(e => ({
    record_id: record.id,
    student_id: e.studentId,
    is_present: e.isPresent,
    observation: e.observation,
  }));

  const { error: entriesError } = await supabase
    .from("attendance_entries")
    .insert(entriesToInsert);

  if (entriesError) {
    console.error("Supabase insert entries error:", entriesError);
    throw new Error(entriesError.message || "Erro ao criar entradas de presença");
  }

  return {
    id: record.id,
    classId: record.class_id,
    date: record.date,
    presentCount: entries.filter(e => e.isPresent).length,
    absentCount: entries.filter(e => !e.isPresent).length,
    observationCount: entries.filter(e => e.observation).length,
  };
}

export async function updateAttendanceRecord(
  id: string,
  date: string,
  entries: Omit<AttendanceEntry, "id" | "recordId">[]
): Promise<AttendanceRecord> {
  // 0. Check if another record already exists for this date (excluding current record)
  const { data: currentRecord } = await supabase
    .from("attendance_records")
    .select("class_id")
    .eq("id", id)
    .single();

  if (currentRecord) {
    const { data: existingRecord, error: checkError } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("class_id", currentRecord.class_id)
      .eq("date", date)
      .neq("id", id)
      .maybeSingle();

    if (checkError) {
      console.error("Supabase check existing record error:", checkError);
    }

    // if (existingRecord) {
    //   throw new Error("Já existe um registro de presença para esta turma nesta data.");
    // }
  }

  // 1. Update the record date
  const { data: record, error: recordError } = await supabase
    .from("attendance_records")
    .update({ date })
    .eq("id", id)
    .select()
    .single();

  if (recordError) {
    console.error("Supabase update record error:", recordError);
    if (recordError.code === 'PGRST301' || recordError.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(recordError.message || "Erro ao atualizar registro de presença");
  }

  // 2. Delete old entries
  const { error: deleteError } = await supabase
    .from("attendance_entries")
    .delete()
    .eq("record_id", id);

  if (deleteError) {
    console.error("Supabase delete entries error:", deleteError);
    throw new Error(deleteError.message || "Erro ao atualizar entradas de presença");
  }

  // 3. Insert new entries
  const entriesToInsert = entries.map(e => ({
    record_id: id,
    student_id: e.studentId,
    is_present: e.isPresent,
    observation: e.observation,
  }));

  const { error: insertError } = await supabase
    .from("attendance_entries")
    .insert(entriesToInsert);

  if (insertError) {
    console.error("Supabase insert entries error:", insertError);
    throw new Error(insertError.message || "Erro ao criar novas entradas de presença");
  }

  return {
    id: record.id,
    classId: record.class_id,
    date: record.date,
    presentCount: entries.filter(e => e.isPresent).length,
    absentCount: entries.filter(e => !e.isPresent).length,
    observationCount: entries.filter(e => e.observation).length,
  };
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase delete record error:", error);
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(error.message || "Erro ao excluir registro de presença");
  }
}
