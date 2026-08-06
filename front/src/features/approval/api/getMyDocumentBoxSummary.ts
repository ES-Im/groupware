import { apiClient } from '@/shared/api/client'
import type { MyDocumentBoxSummary } from '../model/approval'

export async function getMyDocumentBoxSummary(): Promise<MyDocumentBoxSummary> {
  const { data } = await apiClient.get<MyDocumentBoxSummary>('/api/document-boxes/me/summary')
  return data
}
