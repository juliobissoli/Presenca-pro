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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { useGetClass } from "@/src/hooks/classes";
import {
  useCreateClassReminder,
  useDeleteClassReminder,
  useGetClassReminders,
  useUpdateClassReminder,
} from "@/src/hooks/reminders";
import { ClassReminder, User } from "@/src/types";
import { Bell, Clock, Edit2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/router";
import * as React from "react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export default function IntegrationsPage({
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

  const { data: selectedClass } = useGetClass(classId as string);
  const {
    data: reminders,
    isLoading,
    refetch,
  } = useGetClassReminders(classId as string);

  const { execute: createReminder, isLoading: isCreating } =
    useCreateClassReminder();
  const { execute: updateReminder, isLoading: isUpdating } =
    useUpdateClassReminder();
  const { execute: deleteReminder } = useDeleteClassReminder();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingReminder, setEditingReminder] =
    React.useState<ClassReminder | null>(null);
  const [dayOfWeek, setDayOfWeek] = React.useState<string>("1");
  const [hour, setHour] = React.useState<string>("10");
  const [minute, setMinute] = React.useState<string>("00");
  const [isActive, setIsActive] = React.useState(true);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleSaveReminder = async () => {
    if (!classId || !user) return;

    setSaveError(null);
    try {
      const payload = {
        classId: classId as string,
        userId: user.id,
        dayOfWeek: parseInt(dayOfWeek),
        hour: parseInt(hour),
        minute: parseInt(minute),
        isActive,
      };

      if (editingReminder) {
        await updateReminder(editingReminder.id, payload);
      } else {
        await createReminder(payload);
      }

      setIsModalOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save reminder:", error);
      setSaveError(error.message || "Erro ao salvar lembrete");
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lembrete?")) return;
    try {
      await deleteReminder(id);
      refetch();
    } catch (error) {
      console.error("Failed to delete reminder:", error);
    }
  };

  const handleToggleActive = async (reminder: ClassReminder) => {
    try {
      await updateReminder(reminder.id, { isActive: !reminder.isActive });
      refetch();
    } catch (error) {
      console.error("Failed to toggle reminder:", error);
    }
  };

  if (!user) return null;

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      title={
        selectedClass ? `${selectedClass.name} - Integrações` : "Integrações"
      }
    >
      <div className="space-y-6">
        <Submenu selectedClass={selectedClass} classId={classId as string} />

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Lembretes de Marcação</h3>
            <Button
              onClick={() => {
                setEditingReminder(null);
                setDayOfWeek("1");
                setHour("10");
                setMinute("00");
                setIsActive(true);
                setIsModalOpen(true);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Novo lembrete
            </Button>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground animate-pulse">
                  Carregando lembretes...
                </p>
              </div>
            ) : (
              <>
                {reminders.map((reminder) => (
                  <Card key={reminder.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${reminder.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                        >
                          <Bell className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {
                              DAYS_OF_WEEK.find(
                                (d) => d.value === reminder.dayOfWeek,
                              )?.label
                            }
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{" "}
                            {String(reminder.hour).padStart(2, "0")}:
                            {String(reminder.minute).padStart(2, "0")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={reminder.isActive}
                            onCheckedChange={() => handleToggleActive(reminder)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {reminder.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingReminder(reminder);
                              setDayOfWeek(String(reminder.dayOfWeek));
                              setHour(String(reminder.hour));
                              setMinute(String(reminder.minute));
                              setIsActive(reminder.isActive);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500"
                            onClick={() => handleDeleteReminder(reminder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {reminders.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                    <p className="mt-4 text-muted-foreground">
                      Nenhum lembrete configurado
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? "Editar lembrete" : "Novo lembrete"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {saveError && (
              <div className="p-3 text-sm bg-rose-50 text-rose-600 rounded-md border border-rose-100">
                {saveError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Dia da semana</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Minuto</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active-switch">Lembrete ativo</Label>
              <Switch
                id="active-switch"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveReminder}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
