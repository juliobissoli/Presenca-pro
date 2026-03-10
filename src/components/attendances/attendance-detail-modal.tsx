import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Check, X as XIcon } from "lucide-react";
import { getAttendanceEntries } from "@/src/actions/attendances/actions";
import { getStudentsByClass } from "@/src/actions/students/actions";
import { AttendanceEntry, Student } from "@/src/types";

interface AttendanceDetailModalProps {
  recordId: string | null;
  isOpen: boolean;
  onClose: () => void;
  date: string;
  classId: string;
}

export function AttendanceDetailModal({
  recordId,
  isOpen,
  onClose,
  date,
  classId,
}: AttendanceDetailModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [entries, setEntries] = React.useState<AttendanceEntry[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && recordId && classId) {
      fetchData();
    }
  }, [isOpen, recordId, classId]);

  const fetchData = async () => {
    if (!recordId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [entriesData, studentsData] = await Promise.all([
        getAttendanceEntries(recordId),
        getStudentsByClass({ classId, pageSize: 1000 }),
      ]);
      setEntries(entriesData);
      setStudents(studentsData.data);
    } catch (err: any) {
      console.error("Error fetching attendance details:", err);
      setError("Erro ao carregar detalhes da marcação.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || "Aluno não encontrado";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Marcação - {date}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground animate-pulse">Carregando detalhes...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-rose-500 bg-rose-50 rounded-md border border-rose-100">
            {error}
          </div>
        ) : (
          <div className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-center">Presença</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhuma entrada encontrada para este registro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {getStudentName(entry.studentId)}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.isPresent ? (
                            <div className="flex justify-center">
                              <Check className="h-5 w-5 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <XIcon className="h-5 w-5 text-rose-500" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground italic">
                          {entry.observation || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
