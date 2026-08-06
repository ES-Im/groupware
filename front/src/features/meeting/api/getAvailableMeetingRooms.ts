import { apiClient } from '@/shared/api/client'
import type { AvailableMeetingRoomsPage, AvailableMeetingRoomsSearchParams } from '../model/meeting'

export async function getAvailableMeetingRooms(
  params: AvailableMeetingRoomsSearchParams,
): Promise<AvailableMeetingRoomsPage> {
  const query: Record<string, string | number> = {}
  if (params.date) {
    query.date = params.date
  }
  if (params.startAt) {
    query.startAt = params.startAt
  }
  if (params.endAt) {
    query.endAt = params.endAt
  }
  if (params.capacity != null) {
    query.capacity = params.capacity
  }
  if (params.page != null) {
    query.page = params.page
  }
  if (params.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<AvailableMeetingRoomsPage>('/api/meeting-rooms/available', {
    params: query,
  })
  return data
}
