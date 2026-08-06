import { apiClient } from '@/shared/api/client'
import type { FileType } from '../model/me'

export async function uploadEmpFile(empId: number, fileType: FileType, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await apiClient.patch(`/api/employees/${empId}/files`, formData, { params: { fileType } })
}
