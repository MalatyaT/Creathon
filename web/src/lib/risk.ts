const RISK_COLOR = [
  "var(--risk-1)",
  "var(--risk-1)",
  "var(--risk-2)",
  "var(--risk-3)",
  "var(--risk-4)",
  "var(--risk-5)",
];

export function riskColor(score: number) {
  const bucket = Math.min(5, Math.max(0, Math.floor(score / 20)));
  return RISK_COLOR[bucket];
}
