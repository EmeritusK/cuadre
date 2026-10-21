"use client";

import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset, type AuthState } from "@/lib/auth/actions";

export function ResetForm() {
  const [state, action] = useFormState<AuthState, FormData>(requestPasswordReset, {});

  if (state.notice) return <Alert tone="success">{state.notice}</Alert>;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <Field id="email" label="Correo" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.ec"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          required
        />
      </Field>
      <SubmitButton size="lg" pendingLabel="Enviando…">
        Enviar enlace
      </SubmitButton>
    </form>
  );
}
