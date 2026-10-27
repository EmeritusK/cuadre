"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveContext } from "./active";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string; success?: string };

const role = z.enum(["admin", "supervisor", "counter"]);

async function asAdmin() {
  const context = await getActiveContext();
  if (context.role !== "admin") return null;
  return { context, supabase: createClient() };
}

const NOT_ADMIN = { error: "Solo un administrador puede cambiar la empresa y sus miembros." };

export async function renameOrganization(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const admin = await asAdmin();
  if (!admin) return NOT_ADMIN;
  const name = z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(80)
    .safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0]?.message };

  const { error } = await admin.supabase
    .from("organizations")
    .update({ name: name.data })
    .eq("id", admin.context.org.id);
  if (error) return { error: "No pudimos guardar el nombre." };
  revalidatePath("/", "layout");
  return { success: "Nombre actualizado." };
}

export async function inviteMember(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const admin = await asAdmin();
  if (!admin) return NOT_ADMIN;
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email("Escribe un correo válido"),
      role,
    })
    .safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await admin.supabase
    .from("invitations")
    .insert({ org_id: admin.context.org.id, email: parsed.data.email, role: parsed.data.role });
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ese correo ya tiene una invitación pendiente."
          : "No pudimos crear la invitación.",
    };
  }
  revalidatePath("/configuracion");
  return {
    success: `Listo. Cuando ${parsed.data.email} ingrese o cree su cuenta, entrará a ${admin.context.org.name}.`,
  };
}

export async function revokeInvitation(id: string): Promise<SettingsState> {
  const admin = await asAdmin();
  if (!admin) return NOT_ADMIN;
  const { error } = await admin.supabase
    .from("invitations")
    .delete()
    .eq("id", z.string().uuid().parse(id));
  revalidatePath("/configuracion");
  return error ? { error: "No pudimos revocar la invitación." } : {};
}

export async function changeRole(userId: string, nextRole: string): Promise<SettingsState> {
  const admin = await asAdmin();
  if (!admin) return NOT_ADMIN;
  const { error } = await admin.supabase
    .from("memberships")
    .update({ role: role.parse(nextRole) })
    .eq("org_id", admin.context.org.id)
    .eq("user_id", z.string().uuid().parse(userId));
  revalidatePath("/configuracion");
  if (error) {
    return {
      error: error.message.includes("al menos un administrador")
        ? "La empresa necesita al menos un administrador."
        : "No pudimos cambiar el rol.",
    };
  }
  return {};
}

export async function removeFromOrganization(userId: string): Promise<SettingsState> {
  const admin = await asAdmin();
  if (!admin) return NOT_ADMIN;
  const { error } = await admin.supabase
    .from("memberships")
    .delete()
    .eq("org_id", admin.context.org.id)
    .eq("user_id", z.string().uuid().parse(userId));
  revalidatePath("/configuracion");
  if (error) {
    return {
      error: error.message.includes("al menos un administrador")
        ? "No puedes quitar al último administrador."
        : "No pudimos quitar a la persona.",
    };
  }
  return {};
}

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user } = await getActiveContext();
  const name = z
    .string()
    .trim()
    .min(2, "Escribe tu nombre completo")
    .max(120)
    .safeParse(formData.get("fullName"));
  if (!name.success) return { error: name.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name.data })
    .eq("id", user.id);
  if (error) return { error: "No pudimos guardar tu nombre." };
  revalidatePath("/", "layout");
  return { success: "Nombre actualizado." };
}

export async function changePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const parsed = z
    .object({
      password: z.string().min(8, "La contraseña necesita al menos 8 caracteres"),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: "Las contraseñas no coinciden",
      path: ["confirm"],
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error)
    return { error: "No pudimos cambiar la contraseña. Ingresa de nuevo e inténtalo otra vez." };
  return { success: "Contraseña actualizada." };
}
