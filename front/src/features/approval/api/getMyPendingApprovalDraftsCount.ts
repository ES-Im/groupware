import { apiClient } from '@/shared/api/client'

export async function getMyPendingApprovalDraftsCount(): Promise<number> {
  const { data } = await apiClient.get<number>(
    '/api/document-boxes/me/pending-approval-drafts/count',
  )
  return typeof data === 'number' ? data : Number(data)
}
