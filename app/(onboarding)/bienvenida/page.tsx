import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateOrganizationForm } from "./create-organization-form";

export const metadata: Metadata = { title: "Bienvenida" };

const steps = [
  { title: "Crea tu empresa", body: "Tus tomas, proveedores y equipos quedan separados de otras empresas." },
  { title: "Importa el inventario", body: "Sube el CSV de saldos que exporta tu sistema contable." },
  { title: "Arma los equipos", body: "Reparte los proveedores entre equipos y sigue cada línea en vivo." },
];

export default async function WelcomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  await supabase.rpc("accept_invitations");
  const { count } = await supabase
    .from("memberships")
    .select("org_id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (count) redirect("/");

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Bienvenido a Cuadre</h1>
      <p className="mt-2 text-ink-muted">Tres pasos y tu primera toma física queda lista.</p>

      <ol className="mt-10 grid gap-0">
        {steps.map((step, index) => (
          <li key={step.title} className="relative grid grid-cols-[2rem_1fr] gap-4 pb-8 last:pb-0">
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="absolute left-[0.9375rem] top-8 h-full w-0.5 bg-rule" />
            ) : null}
            <span
              aria-hidden="true"
              className={
                index === 0
                  ? "relative z-10 mt-0.5 size-[1.875rem] rounded-full border-[5px] border-scarlet bg-panel"
                  : "relative z-10 mt-0.5 size-[1.875rem] rounded-full border-[3px] border-rule-strong/40 bg-ground"
              }
            />
            <div>
              <h2 className="font-bold">{step.title}</h2>
              <p className="text-sm text-ink-muted">{step.body}</p>
              {index === 0 ? (
                <div className="mt-5">
                  <CreateOrganizationForm />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
