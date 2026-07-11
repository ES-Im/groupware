import { apiClient } from '@/shared/api/client'
import type { FranchiseDailySales } from '../model/franchise'

/**
 * 일 매출 조회(`FRANCHISE_SALES_DAILY`, api-endpoint.md →
 * `GET /api/franchises/{franchiseId}/sales/dates/{date}`, minRole FRANCHISE 또는 ADMIN).
 *
 * date는 `yyyy-MM-dd`(http-request.adoc 실측: `/sales/dates/2026-05-01`)라
 * `<input type="date">` 값을 변환 없이 그대로 쓴다.
 * ⚠️ 응답의 salesDate도 `yyyy-MM-dd` **문자열**이다 — 연/월 매출의 숫자형
 * salesMonth(yyyyMM)/salesDate(yyyyMMdd)와 타입이 다르므로 혼동 금지.
 * 매출 데이터 없음은 **HTTP 204 빈 바디**다(T3.1 런타임 실측 — 404 아님). 이때 axios data는
 * 빈 문자열이라 반환값이 타입과 달리 비어 있을 수 있다 — 이 계층에서 분기하지 않고 소비처
 * (T3.2)가 data 부재를 "매출 데이터 없음" 빈 상태로 렌더한다(에러 아님).
 */
export async function getFranchiseDailySales(
  franchiseId: number,
  date: string,
): Promise<FranchiseDailySales> {
  const { data } = await apiClient.get<FranchiseDailySales>(
    `/api/franchises/${franchiseId}/sales/dates/${date}`,
  )
  return data
}
