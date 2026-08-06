import { apiClient } from '@/shared/api/client'

export async function activateCategory(categoryId: number): Promise<void> {
  await apiClient.patch(`/api/categories/${categoryId}/visibility/activation`)
}

export async function deactivateCategory(categoryId: number): Promise<void> {
  await apiClient.patch(`/api/categories/${categoryId}/visibility/deactivation`)
}
