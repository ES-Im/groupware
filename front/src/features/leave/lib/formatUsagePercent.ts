export function formatUsagePercent(value: number): string {
  return (Math.trunc(value * 100 + 1e-6) / 100).toFixed(2)
}
