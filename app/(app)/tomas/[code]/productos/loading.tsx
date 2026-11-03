import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <PageSkeleton label="Cargando productos…" rows={12} />;
}
