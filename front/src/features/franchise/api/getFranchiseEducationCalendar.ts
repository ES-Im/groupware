import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationCalendarItem } from '../model/franchise'

/**
 * 가맹점 교육 캘린더 조회(`FRANCHISE_EDUCATION_CALENDAR`, api-endpoint.md 기능ID
 * `FRANCHISE_EDUCATION_CALENDAR` → `GET /api/franchise-educations/calendar`, minRole FRANCHISE
 * 또는 ADMIN). 응답 루트는 배열이다(response-fields.adoc 실측).
 *
 * start/end는 둘 다 선택 쿼리(yyyy-MM-dd'T'HH:mm:ss, start 포함·end 미포함)로, 미입력 시 서버가
 * 당월 범위를 기본 적용한다 — 값이 있을 때만 params에 조건부로 채워 쿼리스트링 자체를 생략한다
 * (getFranchises 동형).
 */
export async function getFranchiseEducationCalendar(params?: {
  start?: string
  end?: string
}): Promise<FranchiseEducationCalendarItem[]> {
  const query: Record<string, string> = {}
  if (params?.start) {
    query.start = params.start
  }
  if (params?.end) {
    query.end = params.end
  }
  const { data } = await apiClient.get<FranchiseEducationCalendarItem[]>(
    '/api/franchise-educations/calendar',
    { params: query },
  )
  return data
}
