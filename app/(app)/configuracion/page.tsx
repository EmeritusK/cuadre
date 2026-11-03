import type { Metadata } from "next";
import { MembersTable, ROLE_LABEL } from "@/components/settings/members-table";
import { SettingsForm } from "@/components/settings/settings-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getActiveContext } from "@/lib/org/active";
import { inviteMember, renameOrganization } from "@/lib/org/settings-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configuración" };

export default async function OrganizationSettingsPage() {
  const { org, role, user } = await getActiveContext();
  const isAdmin = role === "admin";
  const supabase = createClient();

  const [{ data: memberships }, { data: invitations }] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, role, created_at")
      .eq("org_id", org.id)
      .order("created_at"),
    isAdmin
      ? supabase
          .from("invitations")
          .select("id, email, role, created_at")
          .eq("org_id", org.id)
          .order("created_at")
      : Promise.resolve({ data: [] }),
  ]);
  const ids = (memberships ?? []).map((m) => m.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <>
      <section aria-labelledby="empresa" className="grid gap-4">
        <h2 id="empresa" className="text-lg font-bold">
          Empresa
        </h2>
        {isAdmin ? (
          <div className="max-w-md">
            <SettingsForm
              action={renameOrganization}
              submitLabel="Guardar nombre"
              pendingLabel="Guardando…"
            >
              <Field id="name" label="Nombre de la empresa">
                <Input id="name" name="name" defaultValue={org.name} required maxLength={80} />
              </Field>
            </SettingsForm>
          </div>
        ) : (
          <p className="text-ink-muted">{org.name}</p>
        )}
      </section>

      <section aria-labelledby="miembros" className="grid grid-cols-1 gap-4 [&>*]:min-w-0">
        <div>
          <h2 id="miembros" className="text-lg font-bold">
            Miembros
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Administradores importan y cierran tomas. Supervisores organizan equipos y piden
            recuentos. Contadores registran conteos desde la app móvil.
          </p>
        </div>
        <MembersTable
          currentUserId={user.id}
          isAdmin={isAdmin}
          members={(memberships ?? []).map((m) => ({
            id: m.user_id,
            name: names.get(m.user_id) ?? "Sin nombre",
            role: m.role,
            since: m.created_at,
          }))}
          invitations={(invitations ?? []).map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            createdAt: i.created_at,
          }))}
        />
        {isAdmin ? (
          <div className="rounded border border-rule bg-panel p-4">
            <h3 className="mb-3 font-bold">Invitar a alguien</h3>
            <SettingsForm
              action={inviteMember}
              submitLabel="Invitar"
              pendingLabel="Invitando…"
              resetOnSuccess
            >
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <Field id="invite-email" label="Correo">
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    placeholder="nombre@empresa.ec"
                    required
                  />
                </Field>
                <Field id="invite-role" label="Rol">
                  <select
                    id="invite-role"
                    name="role"
                    defaultValue="counter"
                    className="h-10 rounded border border-rule-strong/40 bg-panel pl-3 pr-8 text-base sm:text-sm"
                  >
                    {Object.entries(ROLE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </SettingsForm>
          </div>
        ) : null}
      </section>
    </>
  );
}
