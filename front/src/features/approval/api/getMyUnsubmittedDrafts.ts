import { apiClient } from '@/shared/api/client'
import type { DocumentBoxQueryParams, DocumentBoxRow, Page } from '../model/approval'

/**
 * 임시저장함(상신 전 UNSUBMITTED 내 기안서) 목록 조회(`MY_UNSUBMITTED_DRAFTS`, F713 →
 * `GET /api/document-boxes/me/unsubmitted-drafts`, minRole EMPLOYEE(본인)).
 *
 * keyword/page/size 전부 선택값(query-parameters.adoc 실측). 파라미터 조건부 채움·Page 반환·
 * number 미변환 규약은 getMySubmittedDrafts와 동일하다(4종 문서함 공통 계약).
 */
export async function getMyUnsubmittedDrafts(
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
    '/api/document-boxes/me/unsubmitted-drafts',
    { params: query },
  )
  return data
}
