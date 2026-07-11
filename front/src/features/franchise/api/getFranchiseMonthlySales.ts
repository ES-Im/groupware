import { apiClient } from '@/shared/api/client'
import type { FranchiseMonthlySales } from '../model/franchise'

/**
 * 월 매출 조회(`FRANCHISE_SALES_MONTHLY`, api-endpoint.md →
 * `GET /api/franchises/{franchiseId}/sales/months/{yearMonth}`, minRole FRANCHISE 또는 ADMIN).
 *
 * yearMonth는 `yyyy-MM`(http-request.adoc 실측: `/sales/months/2026-05`)이라 매출 기안 작성 폼의
 * `<input type="month">` 값을 변환 없이 그대로 쓴다. 매출 기안 작성 페이지의 [매출액 불러오기]가
 * 응답의 totalSalesAmount를 salesAmount 필드에 주입할 때 소비한다.
 */
export async function getFranchiseMonthlySales(
  franchiseId: number,
  yearMonth: string,
): Promise<FranchiseMonthlySales> {
  const { data } = await apiClient.get<FranchiseMonthlySales>(
    `/api/franchises/${franchiseId}/sales/months/${yearMonth}`,
  )
  return data
}
