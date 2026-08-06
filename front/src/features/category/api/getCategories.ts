import { apiClient } from '@/shared/api/client'
import type { CategoryItem } from '../model/category'

export async function getCategories(): Promise<CategoryItem[]> {
  const { data } = await apiClient.get<CategoryItem[]>('/api/categories')
  return data
}
