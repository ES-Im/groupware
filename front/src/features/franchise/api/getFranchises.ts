import { apiClient } from '@/shared/api/client'
import type { FranchisesPage } from '../model/franchise'

export async function getFranchises(params?: {
  keyword?: string
  status?: string
  managerId?: number
  page?: number
  size?: number
}): Promise<FranchisesPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.status) {
    query.status = params.status
  }
  if (params?.managerId != null) {
    query.managerId = params.managerId
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<FranchisesPage>('/api/franchises', { params: query })
  return data
}
