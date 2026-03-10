import * as React from "react";
import { useRouter } from "next/router";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { UserPlus, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { signup } from "@/src/actions/users/actions";
import { User } from "@/src/types";
import { Mail, CheckCircle2 } from "lucide-react";

export default function SignupPage({ onLogin }: { onLogin: (u: User) => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signup(email, name, password);
      
      if (result.emailConfirmationRequired) {
        setIsSuccess(true);
      } else {
        await onLogin(result);
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar conta. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-none overflow-hidden">
          <div className="h-2 bg-emerald-500 w-full" />
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-50 rounded-full">
                <Mail className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Verifique seu e-mail</CardTitle>
            <CardDescription className="text-base">
              Enviamos um link de confirmação para <span className="font-semibold text-slate-900">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 space-y-2">
              <p>
                Por favor, clique no link enviado para validar sua conta.
              </p>
              <p className="text-xs italic">
                Não recebeu? Verifique sua caixa de <strong>spam</strong> ou lixo eletrônico.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              onClick={() => router.push("/login")} 
              className="w-full rounded-xl h-11 text-base font-medium bg-emerald-600 hover:bg-emerald-700"
            >
              Voltar para o Login
            </Button>
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Cadastro realizado com sucesso</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <UserPlus className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Criar sua conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para começar a gerenciar suas turmas
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input 
                id="name" 
                placeholder="Ex: Prof. João Silva" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Mínimo 6 caracteres"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full rounded-xl h-11 text-base font-medium" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold text-emerald-600" 
                onClick={() => router.push("/login")}
                type="button"
              >
                Entrar
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
