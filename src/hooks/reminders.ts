import * as React from "react";
import { 
  getClassReminders, 
  createClassReminder, 
  updateClassReminder, 
  deleteClassReminder 
} from "@/src/actions/reminders/actions";
import { ClassReminder } from "@/src/types";

export function useGetClassReminders(classId: string) {
  const [data, setData] = React.useState<ClassReminder[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchReminders = React.useCallback(async () => {
    if (!classId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await getClassReminders(classId);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch reminders"));
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  React.useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchReminders,
  };
}

export function useCreateClassReminder() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (reminder: Omit<ClassReminder, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createClassReminder(reminder);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to create reminder");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useUpdateClassReminder() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (id: string, reminder: Partial<Omit<ClassReminder, 'id' | 'createdAt' | 'classId' | 'userId'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateClassReminder(id, reminder);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to update reminder");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useDeleteClassReminder() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteClassReminder(id);
    } catch (err: any) {
      const error = new Error(err.message || "Failed to delete reminder");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}
