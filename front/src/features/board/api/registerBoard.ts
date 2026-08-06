import { apiClient } from '@/shared/api/client'

export interface RegisterBoardPayload {
  categoryId: number
  title: string
  content: string
  publishedAt?: string
}

export async function registerBoard(payload: RegisterBoardPayload): Promise<void> {
  await apiClient.post('/api/boards', payload)
}
