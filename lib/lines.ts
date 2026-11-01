/**
 * Every team is drawn as a transit line. The first four inks are the core palette;
 * the rest extend it for sessions with up to 15 teams. `onInk` is the text colour
 * that keeps 4.5:1 contrast on the ink.
 */
export const LINE_INKS = [
  { name: "Escarlata", ink: "#E21D2D", onInk: "#FFFFFF" },
  { name: "Cobalto", ink: "#1E5BFF", onInk: "#FFFFFF" },
  { name: "Ámbar", ink: "#FFC20E", onInk: "#0B1230" },
  { name: "Verde", ink: "#1E9E45", onInk: "#0B1230" },
  { name: "Violeta", ink: "#7A3FC4", onInk: "#FFFFFF" },
  { name: "Turquesa", ink: "#0B93A1", onInk: "#0B1230" },
  { name: "Naranja", ink: "#F07A1A", onInk: "#0B1230" },
  { name: "Magenta", ink: "#CF2D86", onInk: "#FFFFFF" },
  { name: "Café", ink: "#8A5A2E", onInk: "#FFFFFF" },
  { name: "Lima", ink: "#8DB600", onInk: "#0B1230" },
  { name: "Celeste", ink: "#3FA9E6", onInk: "#0B1230" },
  { name: "Granate", ink: "#8E1B3A", onInk: "#FFFFFF" },
  { name: "Oliva", ink: "#6B7A1F", onInk: "#FFFFFF" },
  { name: "Índigo", ink: "#3B3FA8", onInk: "#FFFFFF" },
  { name: "Gris", ink: "#6B7189", onInk: "#FFFFFF" },
] as const;

export function lineInk(teamCode: number) {
  return LINE_INKS[(teamCode - 1) % LINE_INKS.length]!;
}

export function teamLabel(teamCode: number) {
  return `EQ-${String(teamCode).padStart(2, "0")}`;
}

export function sessionLabel(sessionCode: number) {
  return `TOMA-${String(sessionCode).padStart(4, "0")}`;
}
