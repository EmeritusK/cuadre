import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ResetPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Recuperar contraseña</h1>
      <p className="mb-8 mt-2 text-ink-muted">Te enviaremos un enlace para crear una nueva.</p>
      <ResetForm />
      <p className="mt-8 text-sm">
        <Link href="/ingresar" className="font-semibold text-cobalt hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </>
  );
}
