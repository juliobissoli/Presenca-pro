import * as React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { User } from "@/src/types";
import { mockUser } from "@/src/mockData";

export const LoginView = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [email, setEmail] = React.useState("mateus@exemplo.com");
  const [password, setPassword] = React.useState("123456");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(mockUser);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Presença Pro</h1>
          <p className="text-muted-foreground">Entre na sua conta para gerenciar suas turmas</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </div>
    </div>
  );
};
