import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function SignInPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Ingresar</h1>
      <p className="mb-8 mt-2 text-ink-muted">Sigue tus tomas físicas en vivo.</p>
      {searchParams.error === "enlace" ? (
        <Alert tone="error" className="mb-6">
          El enlace expiró o ya fue usado. Ingresa o pide uno nuevo.
        </Alert>
      ) : null}
      <SignInForm next={searchParams.next} />
      <p className="mt-8 text-sm text-ink-muted">
        ¿Primera vez en Cuadre?{" "}
        <Link href="/registro" className="font-semibold text-cobalt hover:underline">
          Crea una cuenta
        </Link>
      </p>
    </>
  );
}
