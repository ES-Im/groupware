import { apiClient } from '@/shared/api/client'
import type { ActiveFile } from '../model/me'

export async function getFilesInfos(): Promise<ActiveFile[]> {
  const { data } = await apiClient.get<ActiveFile[]>('/api/employees/me/files')
  return data
}
