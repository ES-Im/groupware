import { apiClient } from '@/shared/api/client'

/**
 * 본인 개인파일 활성화/비활성화(`ACTIVATE_ME_FILE`, api-endpoint.md 기능ID `ACTIVATE_ME_FILE` →
 * `PATCH /api/employees/me/files/{fileId}/status`, 권한 EMPLOYEE(본인)).
 *
 * 요청 본문이 JSON이 아니라 `application/x-www-form-urlencoded`(`isForActivate=true`,
 * http-request.adoc 실측)다 — URLSearchParams를 body로 넘기면 axios가 Content-Type을 자동으로
 * `application/x-www-form-urlencoded`로 설정한다(별도 헤더 지정 불필요).
 * 성공 시 `204 No Content`.
 *
 * 도메인 규칙(도메인모델.md §Emp 파일): 같은 타입은 하나만 활성화 가능하므로, 비활성 파일을
 * true로 활성화하면 서버가 같은 타입의 기존 활성 파일을 자동으로 비활성화한다.
 */
export async function activateEmpFile(fileId: number, isForActivate: boolean): Promise<void> {
  await apiClient.patch(
    `/api/employees/me/files/${fileId}/status`,
    new URLSearchParams({ isForActivate: String(isForActivate) }),
  )
}
