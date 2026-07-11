import { apiClient } from '@/shared/api/client'

/**
 * 본인 개인파일 삭제(`EMP_FILE_DELETE`, api-endpoint.md 기능ID `EMP_FILE_DELETE` →
 * `DELETE /api/employees/{empId}/files/{fileId}`, 권한 EMPLOYEE(본인)).
 * 성공 시 `204 No Content`(deleteDraftFile.ts와 동형).
 */
export async function deleteEmpFile(empId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/employees/${empId}/files/${fileId}`)
}
