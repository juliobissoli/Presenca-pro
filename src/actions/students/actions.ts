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
