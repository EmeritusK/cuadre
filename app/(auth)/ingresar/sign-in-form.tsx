"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, type AuthState } from "@/lib/auth/actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useFormState<AuthState, FormData>(signIn, {});

  return (
    <form action={action} className="grid gap-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="next" value={next ?? "/"} />
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
      <Field id="password" label="Contraseña" error={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          required
        />
      </Field>
      <div className="-mt-2 text-right">
        <Link href="/recuperar" className="text-sm font-semibold text-cobalt hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <SubmitButton size="lg" pendingLabel="Ingresando…">
        Ingresar
      </SubmitButton>
    </form>
  );
}
