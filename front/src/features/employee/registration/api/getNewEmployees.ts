import { apiClient } from '@/shared/api/client'
import type { NewEmployeesPage } from '../model/newEmployee'

export async function getNewEmployees(params?: {
  keyword?: string
  page?: number
  size?: number
}): Promise<NewEmployeesPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<NewEmployeesPage>('/api/employees/new', { params: query })
  return data
}
