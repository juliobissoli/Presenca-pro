import * as React from "react";
import { 
  getAttendancesByClass, 
  GetAttendancesParams, 
  GetAttendancesResponse,
  createAttendanceRecord,
  deleteAttendanceRecord,
  updateAttendanceRecord,
  getAttendanceEntries
} from "@/src/actions/attendances/actions";
import { AttendanceEntry, AttendanceRecord } from "@/src/types";

export function useGetAttendancesByClass(params: GetAttendancesParams) {
  const [data, setData] = React.useState<GetAttendancesResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchAttendances = React.useCallback(async () => {
    if (!params.classId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAttendancesByClass(params);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch attendances"));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, params.page, params.pageSize, params.query]);

  React.useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAttendances,
  };
}

export function useCreateAttendance() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (
    classId: string, 
    date: string, 
    entries: Omit<AttendanceEntry, "id" | "recordId">[]
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createAttendanceRecord(classId, date, entries);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to create attendance");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useUpdateAttendance() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (
    id: string,
    date: string,
    entries: Omit<AttendanceEntry, "id" | "recordId">[]
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateAttendanceRecord(id, date, entries);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to update attendance");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useDeleteAttendance() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteAttendanceRecord(id);
    } catch (err: any) {
      const error = new Error(err.message || "Failed to delete attendance");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}
