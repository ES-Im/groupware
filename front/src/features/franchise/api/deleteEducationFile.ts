import { apiClient } from '@/shared/api/client'

/**
 * 교육 첨부파일 삭제(`EDUCATION_FILE_DELETE`, api-endpoint.md 기능ID `EDUCATION_FILE_DELETE` →
 * `DELETE /api/educations/{educationId}/files/{fileId}`, FRANCHISE 또는 ADMIN(교육 등록자)).
 * ⚠️ 경로 prefix가 `/api/educations`다(uploadEducationFile.ts와 동일 주의).
 * 성공 시 `204 No Content`(응답 본문 없음) — 호출부(`useEducationFileDeleteMutation`)가
 * `franchiseKeys.education.detail(educationId)`를 invalidate해 첨부 목록을 재조회한다.
 */
export async function deleteEducationFile(educationId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/educations/${educationId}/files/${fileId}`)
}
