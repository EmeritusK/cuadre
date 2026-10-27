import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getActiveContext } from "@/lib/org/active";
import { changePassword, updateProfile } from "@/lib/org/settings-actions";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const { user } = await getActiveContext();

  return (
    <>
      <section aria-labelledby="perfil" className="grid max-w-md gap-4">
        <h2 id="perfil" className="text-lg font-bold">
          Perfil
        </h2>
        <SettingsForm action={updateProfile} submitLabel="Guardar" pendingLabel="Guardando…">
          <Field
            id="fullName"
            label="Nombre completo"
            hint="Así te ven tu equipo y los supervisores."
          >
            <Input
              id="fullName"
              name="fullName"
              defaultValue={user.fullName ?? ""}
              autoComplete="name"
              required
            />
          </Field>
          <Field id="email" label="Correo">
            <Input id="email" value={user.email} disabled readOnly />
          </Field>
        </SettingsForm>
      </section>

      <section aria-labelledby="clave" className="grid max-w-md gap-4">
        <h2 id="clave" className="text-lg font-bold">
          Contraseña
        </h2>
        <SettingsForm
          action={changePassword}
          submitLabel="Cambiar contraseña"
          pendingLabel="Cambiando…"
          resetOnSuccess
        >
          <Field id="password" label="Nueva contraseña" hint="Al menos 8 caracteres.">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field id="confirm" label="Repite la contraseña">
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
        </SettingsForm>
      </section>
    </>
  );
}
