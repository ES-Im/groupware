import { apiClient } from '@/shared/api/client'

export async function updateCategoryName(categoryId: number, categoryName: string): Promise<void> {
  await apiClient.patch(`/api/categories/${categoryId}/name`, { categoryName })
}
