import * as React from "react";
import { LogOut, FileCheck, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/src/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/src/components/ui/dropdown-menu";
import { User } from "@/src/types";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  title?: string;
}

export const Layout = ({ children, user, onLogout, title = "Presença Pro" }: LayoutProps) => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <Head>
        <title>{title}</title>
      </Head>
      <div className="w-full max-w-[820px] min-h-screen flex flex-col">
        {user && (
          <header className="px-3 mx-6 py-2 my-2 flex items-center justify-between sticky top-0 z-10 bg-gray-50 border shadow-sm rounded-2xl">
          <Link href="/" className="flex item-center gap-2">
              <div className="rounded-lg bg-black text-white p-2">
                <FileCheck className="h-5 w-5 text-white"/>
              </div>
          </Link>
          <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 h-auto p-1 pl-2 rounded-full hover:bg-gray-200 transition-colors">
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-medium leading-none">{user.name || "Usuário"}</p>
                    </div>
                    <Avatar className="border size-8 w-8 h-8" >
                      <AvatarImage alt={user.name || "Usuário"}/>
                      <AvatarFallback>{(user.name || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
          </header>
        )}
        <main className="flex-1 p-6">
          {children}
        </main>
        <footer className="py-6 text-center text-[10px] text-slate-400">
          <p>© 2026 Presença Pro • v1.0.3</p>
        </footer>
      </div>
    </div>
  );
};
