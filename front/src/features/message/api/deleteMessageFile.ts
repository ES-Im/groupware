import { apiClient } from '@/shared/api/client'

/**
 * 쪽지 첨부파일 개별 삭제(`MESSAGE_FILE_DELETE`, F1521,
 * `DELETE /api/messages/{messageId}/files/{fileId}`, 쪽지 작성자). path-parameters.adoc 실측:
 * 요청 본문 없음(path param messageId·fileId), 성공 시 `204 No Content`.
 *
 * 실패(작성자 아님·이미 발송됨 등 서버 최종 판정)는 에러를 그대로 던져 호출부가 handleApiError로
 * 위임하도록 둔다(deleteDraft 동형).
 */
export async function deleteMessageFile(messageId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/messages/${messageId}/files/${fileId}`)
}
