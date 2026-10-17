import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuadre",
  description: "Toma física de inventario en vivo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-EC">
      <body>{children}</body>
    </html>
  );
}
