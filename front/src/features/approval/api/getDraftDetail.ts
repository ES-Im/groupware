import { apiClient } from '@/shared/api/client'
import type { DraftDetailResponse } from '../model/draftDetail'

/**
 * 기안서 상세 조회(`DRAFT_DETAIL`, F701 → `GET /api/drafts/{draftId}`, minRole EMPLOYEE).
 *
 * 조회 가능자(기안자·결재선 결재자·공람 대상자)만 열람 가능하며, 그 외 접근 시 서버가 일반 403
 * 또는 도메인 에러(404 계열)를 반환한다 — 처리는 에러코드에 의존하지 않고 apiError 매핑
 * (403 권한 부족·404 not-found)으로 위임한다(reissue 금지, PRD §접근 권한). board getBoardDetail과
 * 달리 이 GET은 조회수 증가 등 부작용이 없다(공람 읽음은 별도 F709).
 */
export async function getDraftDetail(draftId: number): Promise<DraftDetailResponse> {
  const { data } = await apiClient.get<DraftDetailResponse>(`/api/drafts/${draftId}`)
  return data
}
