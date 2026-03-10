import * as React from "react";
import { Layout } from "@/src/components/Layout";
import { User } from "@/src/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Send, CheckCircle2, AlertCircle, RefreshCw, Save } from "lucide-react";
import { useRouter } from "next/router";

interface SettingsPageProps {
  user: User | null;
  onLogout: () => void;
}

export default function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [manualChatId, setManualChatId] = React.useState(user?.telegramChatId || "");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setManualChatId(user.telegramChatId || "");
    }
  }, [user, router]);

  if (!user) return null;

  const handleTelegramLink = () => {
    const botUsername = "PresencaPro_bot";
    const url = `https://t.me/${botUsername}?start=${user.id}`;
    window.open(url, "_blank");
  };

  const handleSaveManualChatId = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/update-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: manualChatId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha ao salvar Chat ID");
      }

      // Reload to update session
      window.location.reload();
    } catch (error) {
      console.error("Error saving manual chat id:", error);
      alert("Erro ao salvar o Chat ID. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const refreshSession = () => {
    setIsRefreshing(true);
    // Reload the page to trigger fetchSession in _app.tsx
    window.location.reload();
  };

  return (
    <Layout user={user} onLogout={onLogout} title="Configurações - Presença Pro">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as preferências da sua conta e integrações.</p>
        </div>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-600" />
                <CardTitle>Integração com Telegram</CardTitle>
              </div>
              {user.telegramChatId && (
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </div>
              )}
            </div>
            <CardDescription>
              Receba alertas de presença e lembretes diretamente no seu Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {user.telegramChatId ? (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Seu Telegram está configurado!</p>
                    <p className="text-xs text-slate-500 mt-1">
                      ID do Chat: <span className="font-mono">{user.telegramChatId}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Você receberá notificações automáticas conforme configurado nas suas turmas.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">Telegram não configurado</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Conecte seu Telegram para receber alertas em tempo real sobre a presença dos seus alunos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <Label htmlFor="chat_id" className="text-xs font-semibold text-slate-700">Configuração Automática</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {!user.telegramChatId ? (
                    <Button onClick={handleTelegramLink} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      Configurar Bot no Telegram
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleTelegramLink} className="flex-1">
                      Alterar via Telegram
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    onClick={refreshSession} 
                    disabled={isRefreshing}
                    className="text-slate-500"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Atualizar Status
                  </Button>
                </div>
                {!user.telegramChatId && (
                  <p className="text-[10px] text-slate-400 italic">
                    * Ao clicar, você será redirecionado para o Telegram. Clique em "Começar" (Start) no bot para finalizar a configuração.
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <Label htmlFor="manual_chat_id" className="text-xs font-semibold text-slate-700">Configuração Manual</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      id="manual_chat_id"
                      placeholder="Digite o Chat ID manualmente"
                      value={manualChatId}
                      onChange={(e) => setManualChatId(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={handleSaveManualChatId}
                    disabled={isSaving || manualChatId === (user.telegramChatId || "")}
                  >
                    <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
                    <span className="ml-2 hidden sm:inline">Salvar</span>
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Se você já sabe seu Chat ID do Telegram, pode inseri-lo aqui diretamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm opacity-60">
          <CardHeader>
            <CardTitle className="text-lg">Perfil</CardTitle>
            <CardDescription>Informações básicas da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Nome</p>
                <p className="text-sm">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">E-mail</p>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
