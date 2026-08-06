import { apiClient } from '@/shared/api/client'

export async function activateEmpFile(fileId: number, isForActivate: boolean): Promise<void> {
  await apiClient.patch(
    `/api/employees/me/files/${fileId}/status`,
    new URLSearchParams({ isForActivate: String(isForActivate) }),
  )
}
