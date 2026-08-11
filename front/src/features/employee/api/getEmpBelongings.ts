import { apiClient } from '@/shared/api/client'
import type { CurrentDept } from '../model/me'

export async function getEmpBelongings(empId: number): Promise<CurrentDept[]> {
  const { data } = await apiClient.get<CurrentDept[]>(`/api/employees/${empId}/belongings`)
  return data
}
