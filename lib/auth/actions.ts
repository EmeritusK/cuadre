"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"fullName" | "email" | "password", string>>;
  notice?: string;
};

const email = z.string().trim().email("Escribe un correo válido, por ejemplo nombre@empresa.ec");
const password = z.string().min(8, "La contraseña necesita al menos 8 caracteres");

function firstErrors(error: z.ZodError): AuthState["fieldErrors"] {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(flat).map(([key, value]) => [key, value?.[0]]));
}

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Escribe tu contraseña") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error) };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      error:
        error.message === "Email not confirmed"
          ? "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada."
          : "Correo o contraseña incorrectos.",
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2, "Escribe tu nombre completo").max(120),
      email,
      password,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error) };

  const origin = headers().get("origin") ?? "";
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: error.message.includes("registered")
        ? "Ya existe una cuenta con ese correo. Ingresa o recupera tu contraseña."
        : "No pudimos crear la cuenta. Intenta de nuevo en unos minutos.",
    };
  }

  if (!data.session) {
    return { notice: `Te enviamos un enlace a ${parsed.data.email} para confirmar tu cuenta.` };
  }

  redirect("/");
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error) };

  const origin = headers().get("origin") ?? "";
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/configuracion/cuenta`,
  });

  // Same message whether or not the account exists, so emails cannot be enumerated.
  return { notice: `Si ${parsed.data.email} tiene una cuenta, recibirás un enlace en unos minutos.` };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
