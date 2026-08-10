export function formatSalesAmount(value: number): string {
  return Number.isFinite(value) ? `${value.toLocaleString('ko-KR')}원` : ''
}
