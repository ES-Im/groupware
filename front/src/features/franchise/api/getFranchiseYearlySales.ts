import { apiClient } from '@/shared/api/client'
import type { FranchiseYearlySales } from '../model/franchise'

/**
 * 연 매출 조회(`FRANCHISE_SALES_YEARLY`, api-endpoint.md →
 * `GET /api/franchises/{franchiseId}/sales/years/{year}`, minRole FRANCHISE 또는 ADMIN).
 *
 * year는 숫자 연도(http-request.adoc 실측: `/sales/years/2026`)를 경로에 그대로 삽입한다.
 * 매출 데이터 없음은 **HTTP 204 빈 바디**다(T3.1 런타임 실측 — 404 아님). 이때 axios data는
 * 빈 문자열이라 반환값이 타입과 달리 비어 있을 수 있다 — 이 계층에서 분기하지 않고 소비처
 * (T3.2)가 data 부재를 "매출 데이터 없음" 빈 상태로 렌더한다(에러 아님).
 */
export async function getFranchiseYearlySales(
  franchiseId: number,
  year: number,
): Promise<FranchiseYearlySales> {
  const { data } = await apiClient.get<FranchiseYearlySales>(
    `/api/franchises/${franchiseId}/sales/years/${year}`,
  )
  return data
}
