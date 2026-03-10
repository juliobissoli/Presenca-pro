import { Class } from "@/src/types";
import { supabase } from "@/src/lib/supabase";

export interface GetClassesParams {
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface GetClassesResponse {
  data: Class[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getClasses(params: GetClassesParams = {}): Promise<GetClassesResponse> {
  const { page = 1, pageSize = 10, query = "" } = params;

  let supabaseQuery = supabase
    .from("classes")
    .select("*, students(count)", { count: "exact" });

  if (query) {
    supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, count, error } = await supabaseQuery
    .range(start, end)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const classes: Class[] = (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    userId: item.user_id,
    studentCount: item.students?.[0]?.count || 0,
  }));

  return {
    data: classes,
    total: count || 0,
    page,
    pageSize,
  };
}

export async function getClass(id: string): Promise<Class> {
  const { data, error } = await supabase
    .from("classes")
    .select("*, students(count)")
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    userId: data.user_id,
    studentCount: data.students?.[0]?.count || 0,
  };
}

export async function createClass(data: Omit<Class, "id" | "studentCount">): Promise<Class> {
  const { data: newClass, error } = await supabase
    .from("classes")
    .insert({
      name: data.name,
      user_id: data.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(error.message || "Erro ao criar turma no banco de dados");
  }

  return {
    id: newClass.id,
    name: newClass.name,
    userId: newClass.user_id,
    studentCount: 0,
  };
}

export async function updateClass(id: string, data: Partial<Omit<Class, "id">>): Promise<Class> {
  const { data: updatedClass, error } = await supabase
    .from("classes")
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
    throw new Error(error.message || "Erro ao atualizar turma no banco de dados");
  }

  return {
    id: updatedClass.id,
    name: updatedClass.name,
    userId: updatedClass.user_id,
    studentCount: 0, // We don't need the count for the update response usually
  };
}

export async function deleteClass(id: string): Promise<void> {
  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase delete error:", error);
    if (error.code === 'PGRST301' || error.message.includes('JWT')) {
      throw new Error("Sessão expirada ou inválida. Por favor, saia e entre novamente.");
    }
    throw new Error(error.message || "Erro ao excluir turma no banco de dados");
  }
}
