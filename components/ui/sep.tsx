/**
 * Separator dot drawn as a shape: Overpass sets "·" off-centre in its advance,
 * so the character always leans against the next word.
 */
export function Sep() {
  return (
    <>
      <span
        aria-hidden="true"
        className="mx-[0.55em] inline-block size-[3px] rounded-full bg-current align-middle opacity-60"
      />
      <span className="sr-only">, </span>
    </>
  );
}
