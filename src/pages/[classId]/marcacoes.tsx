import {
  checkAttendanceExists,
  getAttendanceEntries,
} from "@/src/actions/attendances/actions";
import Submenu from "@/src/actions/Submenu";
import { AttendanceDetailModal } from "@/src/components/attendances/attendance-detail-modal";
import { Layout } from "@/src/components/Layout";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  useCreateAttendance,
  useDeleteAttendance,
  useGetAttendancesByClass,
  useUpdateAttendance,
} from "@/src/hooks/attendances";
import { useGetClass } from "@/src/hooks/classes";
import { useGetStudentsByClass } from "@/src/hooks/students";
import { cn } from "@/src/lib/utils";
import {
  AttendanceEntry,
  AttendanceRecord,
  User
} from "@/src/types";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Edit2,
  Eye,
  MoreVertical,
  Plus,
  Trash2,
  X as XIcon
} from "lucide-react";
import { useRouter } from "next/router";
import { parseAsInteger, useQueryState } from "nuqs";
import * as React from "react";

export default function AttendancePage({
  user,
  onLogin,
  onLogout,
}: {
  user: User | null;
  onLogin: (u: User) => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const { classId } = router.query;

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize] = useQueryState("pageSize", parseAsInteger.withDefault(10));
  const [searchQuery] = useQueryState("query", { defaultValue: "" });

  const { data: selectedClass, isLoading: isLoadingClass } = useGetClass(
    classId as string,
  );

  const {
    data: attendanceData,
    isLoading: isAttendanceLoading,
    refetch,
  } = useGetAttendancesByClass({
    classId: (classId as string) || "",
    page: page ?? 1,
    pageSize: pageSize ?? 10,
    query: searchQuery ?? "",
  });

  const { execute: createAttendance, isLoading: isCreating } =
    useCreateAttendance();
  const { execute: updateAttendance, isLoading: isUpdating } =
    useUpdateAttendance();
  const { execute: deleteAttendance, isLoading: isDeleting } =
    useDeleteAttendance();

  const { data: studentsData } = useGetStudentsByClass({
    classId: (classId as string) || "",
    pageSize: 100, // Get all students for the wizard
  });

  const [isAttendanceWizardOpen, setIsAttendanceWizardOpen] =
    React.useState(false);
  const [wizardStep, setWizardStep] = React.useState<"date" | "marking">(
    "date",
  );
  const [wizardDate, setWizardDate] = React.useState("");
  const [currentStudentIndex, setCurrentStudentIndex] = React.useState(0);
  const [wizardEntries, setWizardEntries] = React.useState<
    Partial<AttendanceEntry>[]
  >([]);
  const [editingRecord, setEditingRecord] =
    React.useState<AttendanceRecord | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [isFetchingEntries, setIsFetchingEntries] = React.useState(false);
  const [isValidatingDate, setIsValidatingDate] = React.useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(
    null,
  );
  const [selectedRecordDate, setSelectedRecordDate] =
    React.useState<string>("");

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    // Handle both YYYY-MM-DD and ISO strings
    const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = dateOnly.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const startAttendanceWizard = async (record?: AttendanceRecord) => {
    if (!classId) return;
    const classStudents = studentsData?.data || [];
    if (classStudents.length === 0) {
      alert("Adicione alunos primeiro!");
      return;
    }

    setSaveError(null);
    if (record) {
      setEditingRecord(record);
      // Ensure date is in YYYY-MM-DD format for the input
      const formattedDate = record.date.includes("T")
        ? record.date.split("T")[0]
        : record.date;
      setWizardDate(formattedDate);
      setIsFetchingEntries(true);
      setIsAttendanceWizardOpen(true); // Open early to show loading if needed

      try {
        const entries = await getAttendanceEntries(record.id);
        // Map entries to wizard format, ensuring all current students are included
        const mappedEntries = classStudents.map((s) => {
          const existing = entries.find((e) => e.studentId === s.id);
          return {
            studentId: s.id,
            isPresent: existing ? existing.isPresent : true,
            observation: existing ? existing.observation : "",
          };
        });
        setWizardEntries(mappedEntries);
      } catch (error: any) {
        console.error("Failed to fetch entries:", error);
        setSaveError("Erro ao carregar dados da marcação");
      } finally {
        setIsFetchingEntries(false);
      }
    } else {
      setEditingRecord(null);
      setWizardDate("");
      setWizardEntries(
        classStudents.map((s) => ({
          studentId: s.id,
          isPresent: true,
          observation: "",
        })),
      );
      setIsAttendanceWizardOpen(true);
    }

    setWizardStep("date");
    setCurrentStudentIndex(0);
  };

  const handleDateChange = async (date: string) => {
    setWizardDate(date);
    setSaveError(null);

    if (!date || !classId) return;

    const today = format(new Date(), "yyyy-MM-dd");
    if (date > today) {
      setSaveError("A data da marcação não pode ser maior que a data de hoje.");
      return;
    }

    // Only validate if it's a new record OR if the date was changed during editing
    const dateChanged = editingRecord
      ? editingRecord.date.split("T")[0] !== date
      : true;

    if (dateChanged && date.length === 10) {
      setIsValidatingDate(true);
      try {
        const exists = await checkAttendanceExists(classId as string, date);
        if (exists) {
          setSaveError(
            "Já existe um registro de presença para esta turma nesta data.",
          );
        }
      } catch (error) {
        console.error("Error checking date:", error);
      } finally {
        setIsValidatingDate(false);
      }
    }
  };

  const handleNextStep = async () => {
    if (!classId || !wizardDate || saveError) return;
    setWizardStep("marking");
  };

  const handleFinishAttendance = async () => {
    if (!classId) return;

    setSaveError(null);
    try {
      const entriesToSave = wizardEntries.map((e) => ({
        studentId: e.studentId!,
        isPresent: e.isPresent!,
        observation: e.observation || "",
      }));

      if (editingRecord) {
        await updateAttendance(editingRecord.id, wizardDate, entriesToSave);
      } else {
        await createAttendance(classId as string, wizardDate, entriesToSave);
      }

      setIsAttendanceWizardOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save attendance:", error);
      setSaveError(error.message || "Erro ao salvar marcação");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedClass) return;
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
      await deleteAttendance(recordId);
      refetch();
    } catch (error) {
      console.error("Failed to delete attendance:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      title={selectedClass ? `${selectedClass.name} - Marcações` : "Marcações"}
    >
      <div className="space-y-6">
        <Submenu selectedClass={selectedClass} classId={classId as string} />

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Registros de presença</h3>
            <Button
              onClick={() => startAttendanceWizard()}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Novo registro
            </Button>
          </div>

          <div className="space-y-3">
            {isAttendanceLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground animate-pulse">
                  Carregando registros...
                </p>
              </div>
            ) : (
              <>
                {attendanceData?.data.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {formatDateString(record.date)}
                          </p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-500" />{" "}
                              {record.presentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <XIcon className="h-3 w-3 text-rose-500" />{" "}
                              {record.absentCount}
                            </span>
                            {record.observationCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Edit2 className="h-3 w-3" />{" "}
                                {record.observationCount} obs
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRecordId(record.id);
                                  setSelectedRecordDate(
                                    formatDateString(record.date),
                                  );
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Ver marcação
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => startAttendanceWizard(record)}
                              >
                                <Edit2 className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-rose-500 focus:text-rose-500"
                                onClick={() => handleDeleteRecord(record.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {attendanceData?.data.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhum registro ainda
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={isAttendanceWizardOpen}
        onOpenChange={(open) => {
          setIsAttendanceWizardOpen(open);
          if (!open) {
            setSaveError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRecord
                ? "Editar registro de presença"
                : "Criar registro de presença"}
            </DialogTitle>
          </DialogHeader>

          {saveError && (
            <div className="p-3 text-sm bg-rose-50 text-rose-600 rounded-md border border-rose-100">
              {saveError}
            </div>
          )}

          {isFetchingEntries ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground animate-pulse">
                Carregando dados da marcação...
              </p>
            </div>
          ) : wizardStep === "date" ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="markingDate">Data da marcação</Label>
                <Input
                  id="markingDate"
                  type="date"
                  value={wizardDate}
                  max={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsAttendanceWizardOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="w-full"
                  onClick={handleNextStep}
                  disabled={isValidatingDate || !wizardDate || !!saveError}
                >
                  {isValidatingDate ? "Validando data..." : "Iniciar marcação"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {selectedClass && studentsData?.data && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Aluno {currentStudentIndex + 1} de{" "}
                      {studentsData.data.length}
                    </p>
                    <h4 className="text-xl font-bold">
                      {studentsData.data[currentStudentIndex].name}
                    </h4>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      variant={
                        wizardEntries[currentStudentIndex]?.isPresent
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        "flex-1 h-16 text-lg",
                        wizardEntries[currentStudentIndex]?.isPresent &&
                          "bg-emerald-600 hover:bg-emerald-700",
                      )}
                      onClick={() => {
                        const newEntries = [...wizardEntries];
                        newEntries[currentStudentIndex].isPresent = true;
                        setWizardEntries(newEntries);
                      }}
                    >
                      Presente
                    </Button>
                    <Button
                      variant={
                        !wizardEntries[currentStudentIndex]?.isPresent
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        "flex-1 h-16 text-lg",
                        !wizardEntries[currentStudentIndex]?.isPresent &&
                          "bg-rose-600 hover:bg-rose-700",
                      )}
                      onClick={() => {
                        const newEntries = [...wizardEntries];
                        newEntries[currentStudentIndex].isPresent = false;
                        setWizardEntries(newEntries);
                      }}
                    >
                      Faltou
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observation">Observação</Label>
                    <Textarea
                      id="observation"
                      placeholder="Alguma observação?"
                      rows={3}
                      value={
                        wizardEntries[currentStudentIndex]?.observation || ""
                      }
                      onChange={(e) => {
                        const newEntries = [...wizardEntries];
                        newEntries[currentStudentIndex].observation =
                          e.target.value;
                        setWizardEntries(newEntries);
                      }}
                    />
                  </div>

                  <div className="flex justify-between gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={currentStudentIndex === 0}
                      onClick={() =>
                        setCurrentStudentIndex(currentStudentIndex - 1)
                      }
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>

                    {currentStudentIndex === studentsData.data.length - 1 ? (
                      <Button
                        className="flex-1"
                        onClick={handleFinishAttendance}
                        disabled={isCreating || isUpdating}
                      >
                        {isCreating || isUpdating ? "Salvando..." : "Finalizar"}
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={() =>
                          setCurrentStudentIndex(currentStudentIndex + 1)
                        }
                      >
                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AttendanceDetailModal
        recordId={selectedRecordId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecordId(null);
        }}
        date={selectedRecordDate}
        classId={classId as string}
      />
    </Layout>
  );
}
