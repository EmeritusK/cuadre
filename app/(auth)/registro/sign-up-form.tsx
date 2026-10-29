"use client";

import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { signUp, type AuthState } from "@/lib/auth/actions";

export function SignUpForm() {
  const [state, action] = useFormState<AuthState, FormData>(signUp, {});

  if (state.notice) {
    return <Alert tone="success">{state.notice}</Alert>;
  }

  const invalid = (field: "fullName" | "email" | "password") => ({
    "aria-invalid": Boolean(state.fieldErrors?.[field]),
    "aria-describedby": state.fieldErrors?.[field] ? `${field}-error` : `${field}-hint`,
  });

  return (
    <form action={action} className="grid gap-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field id="fullName" label="Nombre completo" error={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          {...invalid("fullName")}
        />
      </Field>
      <Field id="email" label="Correo de trabajo" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.ec"
          required
          {...invalid("email")}
        />
      </Field>
      <Field
        id="password"
        label="Contraseña"
        hint="Al menos 8 caracteres."
        error={state.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          {...invalid("password")}
        />
      </Field>
      <SubmitButton size="lg" pendingLabel="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
