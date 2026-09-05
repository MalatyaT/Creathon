export function TwinMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10" cy="12" r="8" fill="var(--brand-green)" />
      <circle
        cx="15"
        cy="12"
        r="8"
        fill="var(--brand-yellow)"
        style={{ mixBlendMode: "multiply" }}
      />
    </svg>
  );
}
