import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportButton({ code }: { code: number }) {
  return (
    <a
      href={`/tomas/${code}/exportar`}
      download
      className={cn(buttonVariants({ variant: "secondary" }))}
    >
      <Download aria-hidden="true" />
      Exportar CSV
    </a>
  );
}
