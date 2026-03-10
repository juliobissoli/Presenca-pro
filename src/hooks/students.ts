import * as React from "react";
import { 
  getStudentsByClass, 
  GetStudentsParams, 
  GetStudentsResponse,
  createStudent,
  updateStudent,
  deleteStudent
} from "@/src/actions/students/actions";
import { Student } from "@/src/types";

export function useGetStudentsByClass(params: GetStudentsParams) {
  const [data, setData] = React.useState<GetStudentsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchStudents = React.useCallback(async () => {
    if (!params.classId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await getStudentsByClass(params);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch students"));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, params.page, params.pageSize, params.query]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStudents,
  };
}

export function useCreateStudent() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (data: Omit<Student, "id">) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createStudent(data);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to create student");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useUpdateStudent() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (id: string, classId: string, data: Partial<Omit<Student, "id" | "classId">>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateStudent(id, classId, data);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to update student");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useDeleteStudent() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (id: string, classId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteStudent(id, classId);
    } catch (err: any) {
      const error = new Error(err.message || "Failed to delete student");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}
