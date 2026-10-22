"use client";

import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { createOrganization, type OrgFormState } from "@/lib/org/actions";

export function CreateOrganizationForm() {
  const [state, action] = useFormState<OrgFormState, FormData>(createOrganization, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field id="name" label="Nombre de la empresa" hint="Puedes cambiarlo después." error={state.fieldError}>
        <Input
          id="name"
          name="name"
          placeholder="Distribuidora del Valle"
          autoComplete="organization"
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={state.fieldError ? "name-error" : "name-hint"}
          required
        />
      </Field>
      <SubmitButton pendingLabel="Creando…" className="justify-self-start">
        Crear empresa y continuar
      </SubmitButton>
    </form>
  );
}
