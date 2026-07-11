import { apiClient } from '@/shared/api/client'

/**
 * 교육 첨부파일 업로드(`EDUCATION_FILE_UPLOAD`, api-endpoint.md 기능ID `EDUCATION_FILE_UPLOAD` →
 * `PATCH /api/educations/{educationId}/files`, FRANCHISE 또는 ADMIN(교육 등록자)).
 * ⚠️ 경로 prefix가 `/api/educations`다 — 조회 계열(FRANCHISE_EDUCATION_DETAIL 등)의
 * `/api/franchise-educations`와 다르므로 혼동하지 않는다(generated-snippets/EDUCATION_FILE_UPLOAD
 * http-request.adoc 실측).
 *
 * multipart part명은 `file` 단수 1개만 문서화되어 있다(request-parts.adoc 실측, board/draft와
 * 동일 §열린항목). 다중 첨부는 이 함수를 파일별로 순차 호출하는 방식을 기본안으로 삼는다
 * (호출부 `useEducationFileUploadMutation`).
 *
 * FormData를 body로 넘기면 axios가 `Content-Type: multipart/form-data; boundary=...`를 자동으로
 * 설정하므로 별도 헤더 지정은 하지 않는다. 성공 시 `204 No Content`(응답 본문 없음) — 호출부가
 * `franchiseKeys.education.detail(educationId)`를 invalidate해 첨부 목록을 재조회한다.
 */
export async function uploadEducationFile(educationId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/educations/${educationId}/files`, formData)
}
