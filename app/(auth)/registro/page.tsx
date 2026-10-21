import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Crear cuenta</h1>
      <p className="mb-8 mt-2 text-ink-muted">
        Después crearás tu empresa e invitarás a tus supervisores.
      </p>
      <SignUpForm />
      <p className="mt-8 text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-semibold text-cobalt hover:underline">
          Ingresa
        </Link>
      </p>
    </>
  );
}
