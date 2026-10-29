import type { Metadata } from "next";
import { SessionOverview } from "@/components/overview/session-overview";
import { ExportButton } from "@/components/sessions/export-button";
import { SessionActions } from "@/components/sessions/session-actions";
import { SessionBadge } from "@/components/session-badge";
import { PageHeader } from "@/components/shell/page-header";
import { formatDateTime } from "@/lib/format";
import { sessionLabel } from "@/lib/lines";
import { getSessionOverview } from "@/lib/sessions/overview";
import { getSessionByCode } from "@/lib/sessions/queries";

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  return { title: `Resumen ${sessionLabel(Number(params.code))}` };
}

export default async function SessionOverviewPage({ params }: { params: { code: string } }) {
  const { session, context } = await getSessionByCode(params.code);
  const overview = await getSessionOverview(session.id);
  const unassigned = overview.lines.find((line) => line.teamId === null)?.stations.length ?? 0;

  const when =
    session.status === "closed" && session.closed_at
      ? `Cerrada el ${formatDateTime(session.closed_at)}`
      : session.started_at
        ? `Contando desde ${formatDateTime(session.started_at)}`
        : `Importada el ${formatDateTime(session.created_at)}`;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {sessionLabel(session.code)}
            <SessionBadge status={session.status} />
          </span>
        }
        description={`${session.name} · ${session.warehouses?.name ?? "Sin bodega"} · ${when}`}
        actions={
          <>
            <ExportButton code={session.code} />
            {context.role === "admin" ? (
              <SessionActions
                code={session.code}
                status={session.status}
                pendingProducts={overview.summary.products - overview.summary.counted}
                unassignedSuppliers={unassigned}
              />
            ) : null}
          </>
        }
      />
      <SessionOverview
        sessionId={session.id}
        sessionCode={session.code}
        counting={session.status === "counting"}
        overview={overview}
      />
    </>
  );
}
