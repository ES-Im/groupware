import { apiClient } from '@/shared/api/client'
import type {
  BusinessTripHistoryEntry,
  MyBusinessTripHistoryParams,
} from '../model/businessTripHistory'

export async function getMyBusinessTripHistory(
  params?: MyBusinessTripHistoryParams,
): Promise<BusinessTripHistoryEntry[]> {
  const query: Record<string, string> = {}
  if (params?.approvalStatus) {
    query.approvalStatus = params.approvalStatus
  }
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  const { data } = await apiClient.get<BusinessTripHistoryEntry[]>(
    '/api/business-trips/employees/me/request-history',
    { params: query },
  )
  return data
}
