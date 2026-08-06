import { apiClient } from '@/shared/api/client'

export async function deleteEmpFile(empId: number, fileId: number): Promise<void> {
  await apiClient.delete(`/api/employees/${empId}/files/${fileId}`)
}
