import { apiClient } from '@/shared/api/client'
import type { FranchiseInquiriesPage } from '../model/franchise'

export async function getFranchiseInquiries(params?: {
  isAnswered?: boolean
  assignedManagerId?: number
  keyword?: string
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<FranchiseInquiriesPage> {
  const query: Record<string, string | number | boolean> = {}
  if (params?.isAnswered != null) {
    query.isAnswered = params.isAnswered
  }
  if (params?.assignedManagerId != null) {
    query.assignedManagerId = params.assignedManagerId
  }
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.from) {
    query.from = params.from
  }
  if (params?.to) {
    query.to = params.to
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<FranchiseInquiriesPage>('/api/franchise-inquiries', {
    params: query,
  })
  return data
}
