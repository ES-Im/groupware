import { apiClient } from '@/shared/api/client'
import type { MeResponse } from '../model/me'

export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/api/employees/me')
  return data
}
