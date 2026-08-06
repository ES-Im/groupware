import { apiClient } from '@/shared/api/client'
import type { MeetingManagementPage, MeetingManagementSearchParams } from '../model/meeting'

export async function getManagementReservations(
  params?: MeetingManagementSearchParams,
): Promise<MeetingManagementPage> {
  const query: Record<string, string | number> = {}
  if (params?.yearMonth) {
    query.yearMonth = params.yearMonth
  }
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.meetingRoomId != null) {
    query.meetingRoomId = params.meetingRoomId
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<MeetingManagementPage>('/api/meetings', {
    params: query,
  })
  return data
}
