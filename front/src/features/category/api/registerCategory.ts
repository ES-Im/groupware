import { apiClient } from '@/shared/api/client'

export async function registerCategory(categoryName: string): Promise<void> {
  await apiClient.post('/api/categories', { categoryName })
}
