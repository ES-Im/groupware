import { apiClient } from '@/shared/api/client'

/**
 * 게시글 첨부파일 업로드(`BOARD_FILE_UPLOAD`, api-endpoint.md 기능ID `BOARD_FILE_UPLOAD` →
 * `PATCH /api/boards/{boardId}/files`, 게시글 작성자 또는 ADMIN).
 *
 * multipart part명은 `file` 단수 1개만 문서화되어 있다(`request-parts.adoc` 실측, §열린항목3).
 * 다중 첨부는 이 함수를 파일별로 순차 호출하는 방식을 기본안으로 삼는다(호출부
 * `useBoardFileUploadMutation`) — 다중 part 일괄 전송 가능 여부는 백엔드 미확정이라 시도하지
 * 않는다.
 *
 * FormData를 body로 넘기면 axios가 `Content-Type: multipart/form-data; boundary=...`를
 * 자동으로 설정하므로 별도 헤더 지정은 하지 않는다. 성공 시 `204 No Content`(응답 본문 없음) —
 * 호출부가 `boardKeys.files(boardId)`를 invalidate해 첨부 목록을 재조회한다.
 */
export async function uploadBoardFile(boardId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/boards/${boardId}/files`, formData)
}
