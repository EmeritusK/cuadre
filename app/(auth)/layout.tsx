import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative hidden overflow-hidden bg-night p-10 text-night-fg lg:flex lg:flex-col">
        <Brand />
        <NetworkIllustration />
        <p className="relative mt-auto max-w-sm text-lg leading-relaxed text-night-fg/90">
          Cada equipo es una línea, cada proveedor una estación. Mira la toma física avanzar en vivo y
          encuentra dónde está la plata antes de cerrar.
        </p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Brand className="mb-10 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}

const lines = [
  { ink: "#E21D2D", d: "M-20 120 H180 L300 240 H520" },
  { ink: "#1E5BFF", d: "M60 520 V380 L200 240 H420 L520 140" },
  { ink: "#FFC20E", d: "M-20 330 H140 L260 450 H520" },
  { ink: "#1E9E45", d: "M380 -20 V120 L300 200 V560" },
];

const stations = [
  [120, 120, true],
  [240, 180, true],
  [420, 240, false],
  [60, 440, true],
  [200, 240, true],
  [340, 240, false],
  [90, 330, true],
  [380, 450, false],
  [300, 320, false],
  [380, 80, true],
] as const;

function NetworkIllustration() {
  return (
    <svg
      viewBox="0 0 500 520"
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-24 mx-auto w-[min(100%,520px)] opacity-90"
    >
      <g fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        {lines.map((line) => (
          <path key={line.ink} d={line.d} stroke={line.ink} />
        ))}
      </g>
      {stations.map(([x, y, counted]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r="8"
          fill={counted ? "#F4F1EA" : "#0B1230"}
          stroke="#F4F1EA"
          strokeWidth="3.5"
        />
      ))}
      <circle cx="300" cy="240" r="15" fill="#0B1230" stroke="#F4F1EA" strokeWidth="5" />
    </svg>
  );
}
