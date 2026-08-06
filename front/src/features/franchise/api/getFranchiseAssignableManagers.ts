import { apiClient } from '@/shared/api/client'
import type { AssignableManager } from '../model/franchise'

export async function getFranchiseAssignableManagers(): Promise<AssignableManager[]> {
  const { data } = await apiClient.get<AssignableManager[]>('/api/franchises/assignable-managers')
  return data
}
