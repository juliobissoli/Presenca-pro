import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Class } from "../types";

export default function Submenu({
  selectedClass,
  classId,
}: {
  selectedClass: Class;
  classId: string;
}) {
  const currentPath = usePathname();
  const router = useRouter();
  return (
    <div className="flex items-center gap-4 w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-medium">{selectedClass?.name}</h2>
      </div>

      <span className="text-gray-400">/</span>
      <button
        className={cn(
          "px-3 py-1 border-b border-transparent text-sm text-muted-foreground cursor-pointer hover:border-muted-foreground",
          currentPath === `/${classId}/marcacoes` &&
            "border-b-black text-black",
        )}
        onClick={() => router.push(`/${classId}/marcacoes`)}
        disabled={currentPath === `/${classId}/marcacoes`}
      >
        Marcações
      </button>
      <button
        className={cn(
          "px-3 py-1 border-b border-transparent text-sm text-muted-foreground cursor-pointer hover:border-muted-foreground",
          currentPath === `/${classId}/aluno` && "border-b-black text-black",
        )}
        onClick={() => router.push(`/${classId}/aluno`)}
        disabled={currentPath === `/${classId}/aluno`}
      >
        Alunos
      </button>
      <button
        onClick={() => router.push(`/${classId}/integrations`)}
        className={cn(
          "px-3 py-1 border-b border-transparent text-sm text-muted-foreground cursor-pointer hover:border-muted-foreground",
          currentPath === `/${classId}/integrations` &&
            "border-b-black text-black",
        )}
        disabled={currentPath === `/${classId}/integrations`}
      >
        Integrações
      </button>
    </div>
  );
}
