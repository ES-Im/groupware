import { apiClient } from '@/shared/api/client'
import type { MyDocumentBoxSummary } from '../model/approval'

/**
 * 문서함 요약 조회(`MY_DOCUMENT_BOX_SUMMARY`, F715 →
 * `GET /api/document-boxes/me/summary`, minRole EMPLOYEE(본인)).
 *
 * 응답은 배열이 아닌 단일 객체(MyDocumentBoxSummary)다(response-fields.adoc 실측 — content/Page
 * 래핑 없음). 4종 문서함 건수(결재대기/임시저장/상신/조회가능)를 한 번에 반환한다. 쿼리 파라미터는
 * 없다(본인 스코프 고정, `/me`).
 */
export async function getMyDocumentBoxSummary(): Promise<MyDocumentBoxSummary> {
  const { data } = await apiClient.get<MyDocumentBoxSummary>('/api/document-boxes/me/summary')
  return data
}
