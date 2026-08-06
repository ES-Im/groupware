import { apiClient } from '@/shared/api/client'
import type { MeetingRoomManagementPage, MeetingRoomManagementSearchParams } from '../model/meeting'

export async function getMeetingRoomManagementList(
  params?: MeetingRoomManagementSearchParams,
): Promise<MeetingRoomManagementPage> {
  const query: Record<string, number | boolean> = {}
  if (params?.available != null) {
    query.available = params.available
  }
  if (params?.bookedInFuture != null) {
    query.bookedInFuture = params.bookedInFuture
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<MeetingRoomManagementPage>('/api/meeting-rooms/management', {
    params: query,
  })
  return data
}
