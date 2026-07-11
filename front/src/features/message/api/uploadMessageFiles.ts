import { apiClient } from '@/shared/api/client'

/**
 * 쪽지 첨부파일 업로드(`MESSAGE_FILE_UPLOAD`, F1520 → `PATCH /api/messages/{messageId}/files`,
 * 쪽지 작성자, ROADMAP(MESSAGE) T4.3-a).
 *
 * multipart part명은 `file` 단수 1개만 문서화되어 있다(`request-parts.adoc` 실측) — approval
 * `uploadDraftFile` 선례 그대로 다중 첨부를 파일별 순차 PATCH로 처리하고, 다중 part 일괄
 * 전송은 백엔드 미확정이라 시도하지 않는다. 순차 처리 중 하나라도 실패하면 그 시점에서
 * 중단하고 에러를 그대로 던진다 — 이미 업로드된 파일의 반영은 이후 재조회에 맡기고, 중간
 * 실패 복구 UX는 오케스트레이션(T4.3-b) 몫이다.
 *
 * 개수(최대 10개)·총량(10MB)·확장자 사전검증은 스테이징 단계의 messageFileValidation(T4.1,
 * `도메인모델.md` 1758행 실측)이 이미 걸렀다는 전제라 여기서 재검증하지 않는다 —
 * `file-upload.md`의 20MB는 서버 multipart 상위 천장일 뿐 프론트 사전검증 기준이 아니다.
 *
 * FormData를 body로 넘기면 axios가 `Content-Type: multipart/form-data; boundary=...`를 자동
 * 설정하므로 별도 헤더 지정은 하지 않는다. 성공 시 `204 No Content`(응답 본문 없음).
 */
export async function uploadMessageFiles(messageId: number, files: File[]): Promise<void> {
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    await apiClient.patch(`/api/messages/${messageId}/files`, formData)
  }
}
