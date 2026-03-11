import { Edit2, MoreVertical, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/router";
import { parseAsInteger, useQueryState } from "nuqs";
import * as React from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  useCreateClass,
  useDeleteClass,
  useGetClasses,
  useUpdateClass,
} from "../hooks/classes";
import { Class, User } from "../types";

export default function HomePage({
  user,
  onLogin,
  onLogout,
}: {
  user: User | null;
  onLogin: (u: User) => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize] = useQueryState("pageSize", parseAsInteger.withDefault(100));
  const [searchQuery] = useQueryState("query", { defaultValue: "" });

  const { data, isLoading, refetch } = useGetClasses({
    page: page ?? 1,
    pageSize: pageSize ?? 10,
    query: searchQuery ?? "",
  });

  const { execute: createClass, isLoading: isCreating } = useCreateClass();
  const { execute: updateClass, isLoading: isUpdating } = useUpdateClass();
  const { execute: deleteClass, isLoading: isDeleting } = useDeleteClass();

  const [isCreateClassOpen, setIsCreateClassOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<Class | null>(null);
  const [newClassName, setNewClassName] = React.useState("");
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !user) return;

    setSaveError(null);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, { name: newClassName });
      } else {
        await createClass({
          name: newClassName,
          userId: user.id,
        });
      }

      setNewClassName("");
      setEditingClass(null);
      setIsCreateClassOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save class:", error);
      setSaveError(error.message || "Erro ao salvar turma");
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;

    try {
      await deleteClass(id);
      refetch();
    } catch (error) {
      console.error("Failed to delete class:", error);
    }
  };

  const handleEditClass = (e: React.MouseEvent, cls: Class) => {
    e.stopPropagation();
    setEditingClass(cls);
    setNewClassName(cls.name);
    setIsCreateClassOpen(true);
  };

  if (!user) {
    return null; // Middleware will handle redirect
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Turmas</h2>
          <Button
            onClick={() => setIsCreateClassOpen(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Criar Turma
          </Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground animate-pulse">
                Carregando turmas...
              </p>
            </div>
          ) : (
            <>
              {data?.data.map((cls) => (
                <Card
                  key={cls.id}
                  className="cursor-pointer hover:border-primary transition-colors group relative shadow-none rounded-lg"
                  onClick={() => router.push(`/${cls.id}/marcacoes`)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cls.studentCount} alunos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleEditClass(e, cls)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClass(e, cls.id)}
                            className="text-rose-600 focus:text-rose-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {data?.data.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-4 text-muted-foreground">
                    Nenhuma turma cadastrada
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={isCreateClassOpen}
        onOpenChange={(open) => {
          setIsCreateClassOpen(open);
          if (!open) {
            setEditingClass(null);
            setNewClassName("");
            setSaveError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Editar turma" : "Criar turma"}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? "Altere o nome da turma abaixo."
                : "Insira o nome da nova turma para começar."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {saveError && (
              <div className="p-3 text-sm bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                {saveError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="className">Nome da turma</Label>
              <Input
                id="className"
                placeholder="Ex: Year 5th White"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateClassOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateClass}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Salvando..."
                : editingClass
                  ? "Salvar"
                  : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
