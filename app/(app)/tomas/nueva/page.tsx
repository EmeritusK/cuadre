import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { getActiveContext } from "@/lib/org/active";
import { ImportWizard } from "./import-wizard";

export const metadata: Metadata = { title: "Importar inventario" };

export default async function NewSessionPage() {
  const { role } = await getActiveContext();
  if (role !== "admin") redirect("/tomas");

  const month = new Intl.DateTimeFormat("es-EC", { month: "long", year: "numeric" }).format(
    new Date(),
  );

  return (
    <>
      <PageHeader
        title="Importar inventario"
        description="Sube el reporte de saldos del sistema contable para abrir una toma nueva."
      />
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <ImportWizard defaultName={`Toma de ${month}`} />
      </div>
    </>
  );
}
