import Submenu from "@/src/actions/Submenu";
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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useGetClass } from "@/src/hooks/classes";
import {
  useCreateStudent,
  useDeleteStudent,
  useGetStudentsByClass,
  useUpdateStudent,
} from "@/src/hooks/students";
import { Student, User } from "@/src/types";
import { Edit2, Plus, Trash2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/router";
import { parseAsInteger, useQueryState } from "nuqs";
import * as React from "react";

export default function StudentsPage({
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

  const pageSizeDefault = 100;
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(pageSizeDefault),
  );
  const [searchQuery] = useQueryState("query", { defaultValue: "" });

  const { data: selectedClass, isLoading: isLoadingClass } = useGetClass(
    classId as string,
  );

  const { data, isLoading, refetch } = useGetStudentsByClass({
    classId: (classId as string) || "",
    page: page ?? 1,
    pageSize: pageSize ?? 10,
    query: searchQuery ?? "",
  });

  const { execute: createStudent, isLoading: isCreating } = useCreateStudent();
  const { execute: updateStudent, isLoading: isUpdating } = useUpdateStudent();
  const { execute: deleteStudent, isLoading: isDeleting } = useDeleteStudent();

  const [isCreateStudentOpen, setIsCreateStudentOpen] = React.useState(false);
  const [newStudentName, setNewStudentName] = React.useState("");
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(
    null,
  );
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleCreateStudent = async () => {
    if (!newStudentName.trim() || !classId) return;

    setSaveError(null);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, classId as string, {
          name: newStudentName,
        });
      } else {
        await createStudent({
          name: newStudentName,
          classId: classId as string,
        });
      }

      setNewStudentName("");
      setEditingStudent(null);
      setIsCreateStudentOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save student:", error);
      setSaveError(error.message || "Erro ao salvar aluno");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedClass) return;
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return;

    try {
      await deleteStudent(studentId, selectedClass.id);
      refetch();
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      title={selectedClass ? `${selectedClass.name} - Alunos` : "Alunos"}
    >
      <div className="space-y-6">
        <Submenu selectedClass={selectedClass} classId={classId as string} />

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lista de alunos</h3>
            <Button
              onClick={() => {
                setEditingStudent(null);
                setNewStudentName("");
                setIsCreateStudentOpen(true);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Novo aluno
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground animate-pulse">
                  Carregando alunos...
                </p>
              </div>
            ) : (
              <>
                {data?.data.map((student) => (
                  <Card key={student.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                          {(student.name || "A").charAt(0)}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingStudent(student);
                            setNewStudentName(student.name);
                            setIsCreateStudentOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-500"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {data?.data.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <UserIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhum aluno cadastrado
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={isCreateStudentOpen}
        onOpenChange={(open) => {
          setIsCreateStudentOpen(open);
          if (!open) {
            setEditingStudent(null);
            setNewStudentName("");
            setSaveError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Editar aluno" : "Criar aluno"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {saveError && (
              <div className="p-3 text-sm bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                {saveError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="studentName">Nome</Label>
              <Input
                id="studentName"
                placeholder="Nome completo do aluno"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateStudentOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateStudent}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Salvando..."
                : editingStudent
                  ? "Salvar"
                  : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
