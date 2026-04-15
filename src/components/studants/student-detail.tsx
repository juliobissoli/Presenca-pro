import * as React from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Check, X as XIcon, BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
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
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useGetStudentAttendanceSummary } from "@/src/hooks/students";
import { Student } from "@/src/types";

interface StudentDetailProps {
  student: Student | null;
  classId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 5;

export function StudentDetail({ student, classId, isOpen, onClose }: StudentDetailProps) {
  const today = new Date();
  const [startDate, setStartDate] = React.useState(
    format(startOfMonth(today), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = React.useState(format(today, "yyyy-MM-dd"));
  const [page, setPage] = React.useState(1);

  // Reset page when dates change
  React.useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  // Reset state when a new student is opened
  React.useEffect(() => {
    if (isOpen) {
      setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd"));
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      setPage(1);
    }
  }, [isOpen, student?.id]);

  const { data, isLoading, error } = useGetStudentAttendanceSummary({
    studentId: student?.id || "",
    classId,
    startDate,
    endDate,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalEntries / PAGE_SIZE)) : 1;

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student?.name}</DialogTitle>
        </DialogHeader>

        {/* Date filter */}
        <div className="flex gap-4 pt-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="startDate" className="text-xs">Data inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="endDate" className="text-xs">Data final</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              min={startDate}
              max={format(today, "yyyy-MM-dd")}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground animate-pulse">Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-rose-500 bg-rose-50 rounded-md border border-rose-100">
            Erro ao carregar dados do aluno.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border bg-emerald-50 p-4 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="h-5 w-5" />
                  <span className="text-2xl font-bold">{data?.totalPresent ?? 0}</span>
                </div>
                <span className="text-xs text-muted-foreground">Presenças</span>
              </div>
              <div className="rounded-lg border bg-rose-50 p-4 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-rose-600">
                  <XIcon className="h-5 w-5" />
                  <span className="text-2xl font-bold">{data?.totalAbsent ?? 0}</span>
                </div>
                <span className="text-xs text-muted-foreground">Faltas</span>
              </div>
            </div>

            {/* Entries list */}
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Marcações</p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-center">Presença</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!data?.entries.length ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <BookOpen className="h-6 w-6 opacity-20" />
                            <span>Nenhuma marcação no período</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.entries.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatDateString(entry.date)}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.isPresent ? (
                              <div className="flex justify-center">
                                <Check className="h-4 w-4 text-emerald-500" />
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <XIcon className="h-4 w-4 text-rose-500" />
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

              {/* Pagination */}
              {(data?.totalEntries ?? 0) > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
