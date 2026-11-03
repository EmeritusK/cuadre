/**
 * Middle-dot separator with real spacing. Overpass sets "·" and its word spaces
 * so tight that " · " collapses visually, so the gap is drawn with margins.
 */
export function Sep() {
  return (
    <>
      <span aria-hidden="true" className="mx-[0.4em] inline-block opacity-60">
        ·
      </span>
      <span className="sr-only">, </span>
    </>
  );
}
