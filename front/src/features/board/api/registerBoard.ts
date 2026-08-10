import { apiClient } from '@/shared/api/client'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'

export interface RegisterBoardPayload {
  categoryId: number
  title: string
  content: string
  publishedAt?: string
}

export async function registerBoard(payload: RegisterBoardPayload): Promise<RegisterDomainIdResponse> {
  const { data } = await apiClient.post<RegisterDomainIdResponse>('/api/boards', payload)
  return data
}
