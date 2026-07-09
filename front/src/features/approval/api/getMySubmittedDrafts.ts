import { apiClient } from '@/shared/api/client'
import type { DocumentBoxQueryParams, DocumentBoxRow, Page } from '../model/approval'

/**
 * 상신함(내 상신 기안서) 목록 조회(`MY_SUBMITTED_DRAFTS`, F712 →
 * `GET /api/document-boxes/me/submitted-drafts`, minRole EMPLOYEE(본인)).
 *
 * keyword/page/size 쿼리 파라미터는 전부 선택값이다(query-parameters.adoc 실측). 값이 없는
 * 파라미터는 쿼리스트링에서 생략되도록 params 객체에 조건부로만 채운다(attendance
 * getMyAttendanceMonthly와 동일 패턴). 응답은 Spring Data Page 표준(Page<DocumentBoxRow>)
 * 그대로 반환하고, number(0-based)는 파싱 단계에서 변환하지 않고 UI 소비 시점에 +1한다
 * (docs/backend-contract/page.md 컨벤션).
 */
export async function getMySubmittedDrafts(
  params?: DocumentBoxQueryParams,
): Promise<Page<DocumentBoxRow>> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<Page<DocumentBoxRow>>(
    '/api/document-boxes/me/submitted-drafts',
    { params: query },
  )
  return data
}
