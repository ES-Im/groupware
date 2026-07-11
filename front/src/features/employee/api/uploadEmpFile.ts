import { apiClient } from '@/shared/api/client'
import type { FileType } from '../model/me'

/**
 * 사원 파일(프로필사진/전자서명) 업로드(`EMP_FILE_UPLOAD`, api-endpoint.md 기능ID
 * `EMP_FILE_UPLOAD` → `PATCH /api/employees/{empId}/files?fileType={value}`, 권한 EMPLOYEE(본인)).
 *
 * multipart part명은 `file` 단수 1개만 문서화되어 있다(request-parts.adoc 실측,
 * uploadMeetingRoomFile.ts와 동형). FormData를 body로 넘기면 axios가
 * `Content-Type: multipart/form-data; boundary=...`를 자동으로 설정하므로 별도 헤더 지정은 하지
 * 않는다. `fileType`은 필수 쿼리 파라미터(query-parameters.adoc 실측: PROFILE_PICTURE, SIGNATURE).
 * 성공 시 `204 No Content`.
 *
 * 도메인 규칙(도메인모델.md §Emp 파일): 새 파일을 추가하면 같은 타입의 기존 활성 파일은
 * 서버가 자동으로 비활성화한다 — 프론트가 별도로 이전 파일을 비활성화할 필요는 없다.
 */
export async function uploadEmpFile(empId: number, fileType: FileType, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/employees/${empId}/files`, formData, { params: { fileType } })
}
