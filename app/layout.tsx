import type { Metadata } from "next";
import { Barlow_Condensed, Overpass } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const overpass = Overpass({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Condensed signage caps for codes, line labels, stations and table heads.
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Cuadre", template: "%s · Cuadre" },
  description: "Toma física de inventario en vivo: avance, faltantes y sobrantes por equipo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-EC"
      className={`${overpass.variable} ${barlow.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" toastOptions={{ className: "font-sans" }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
