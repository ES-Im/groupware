import { apiClient } from '@/shared/api/client'
import type { CategoryManagementPage } from '../model/category'

export async function getCategoryManagement(params?: {
  keyword?: string
  isVisible?: boolean
  page?: number
  size?: number
}): Promise<CategoryManagementPage> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.isVisible != null) {
    query.isVisible = params.isVisible
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<CategoryManagementPage>('/api/categories/management', {
    params: query,
  })
  return data
}
