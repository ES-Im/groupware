import { apiClient } from '@/shared/api/client'

/**
 * 기안서 첨부파일 삭제(`DRAFT_FILE_DELETE`, F717 → `DELETE /api/drafts/{draftId}/files/{fileId}`,
 * 기안자 본인). 성공 시 `204 No Content`(응답 본문 없음) — 호출부(`useDraftFileDeleteMutation`)가
 * `approvalKeys.all`을 invalidate해 상세(첨부 목록 포함)를 재조회한다.
 */
export async function deleteDraftFile(draftId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/drafts/${draftId}/files/${fileId}`)
}
