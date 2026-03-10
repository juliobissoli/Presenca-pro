import * as React from "react";
import { 
  getClasses, 
  GetClassesParams, 
  GetClassesResponse,
  createClass,
  updateClass,
  deleteClass,
  getClass
} from "@/src/actions/classes/actions";
import { Class } from "@/src/types";

export function useGetClass(id: string) {
  const [data, setData] = React.useState<Class | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchClass = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getClass(id);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch class"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchClass();
  }, [fetchClass]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchClass,
  };
}

export function useGetClasses(params: GetClassesParams = {}) {
  const [data, setData] = React.useState<GetClassesResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchClasses = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getClasses(params);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch classes"));
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.pageSize, params.query]);

  React.useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchClasses,
  };
}

export function useCreateClass() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (data: Omit<Class, "id" | "studentCount">) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createClass(data);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to create class");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useUpdateClass() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (id: string, data: Partial<Omit<Class, "id">>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateClass(id, data);
      return result;
    } catch (err: any) {
      const error = new Error(err.message || "Failed to update class");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}

export function useDeleteClass() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteClass(id);
    } catch (err: any) {
      const error = new Error(err.message || "Failed to delete class");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}
