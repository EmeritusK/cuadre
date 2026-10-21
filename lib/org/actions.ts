"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE } from "./active";

export type OrgFormState = { error?: string; fieldError?: string };

const orgName = z
  .string()
  .trim()
  .min(2, "El nombre necesita al menos 2 caracteres")
  .max(80, "Máximo 80 caracteres");

export async function createOrganization(
  _prev: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const parsed = orgName.safeParse(formData.get("name"));
  if (!parsed.success) return { fieldError: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data, error } = await supabase
    .from("organizations")
    .insert({ name: parsed.data, created_by: user.id })
    .select("id")
    .single();
  if (error) return { error: "No pudimos crear la empresa. Intenta de nuevo." };

  cookies().set(ACTIVE_ORG_COOKIE, data.id, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect("/tomas/nueva");
}

export async function switchOrganization(orgId: string) {
  cookies().set(ACTIVE_ORG_COOKIE, orgId, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect("/");
}
