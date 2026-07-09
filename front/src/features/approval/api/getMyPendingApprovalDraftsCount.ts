import { apiClient } from '@/shared/api/client'

/**
 * 결재 대기 건수 조회(`MY_PENDING_APPROVAL_DRAFTS_COUNT`, F711 →
 * `GET /api/document-boxes/me/pending-approval-drafts/count`, minRole EMPLOYEE(본인)).
 *
 * 응답이 JSON 객체가 아니라 **bare number 스칼라**(예 `3`)다(response-body.adoc 실측). 프로젝트 axios
 * 인스턴스(shared/api/client.ts)는 커스텀 transformResponse가 없어 axios 기본 파서가 본문을
 * JSON.parse하므로 data는 number로 들어온다. 다만 content-type이 text 계열로 내려오는 예외에서
 * 문자열("3")로 남을 수 있어 방어적으로 Number()로 정규화한다(호출측 뱃지는 값 > 0일 때만 표시).
 */
export async function getMyPendingApprovalDraftsCount(): Promise<number> {
  const { data } = await apiClient.get<number>(
    '/api/document-boxes/me/pending-approval-drafts/count',
  )
  return typeof data === 'number' ? data : Number(data)
}
