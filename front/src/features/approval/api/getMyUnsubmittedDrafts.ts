import { apiClient } from '@/shared/api/client'
import type { DocumentBoxQueryParams, DocumentBoxRow, Page } from '../model/approval'

export async function getMyUnsubmittedDrafts(
  params?: DocumentBoxQueryParams,
): Promise<Page<DocumentBoxRow>> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<Page<DocumentBoxRow>>(
    '/api/document-boxes/me/unsubmitted-drafts',
    { params: query },
  )
  return data
}
