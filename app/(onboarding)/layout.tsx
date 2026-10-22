import { Brand } from "@/components/brand";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex h-16 items-center bg-night px-4 text-night-fg sm:px-8">
        <Brand />
      </header>
      <main className="mx-auto max-w-xl px-4 py-14 sm:px-8">{children}</main>
    </div>
  );
}
