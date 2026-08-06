import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import { getAvailableMeetingRooms } from './getAvailableMeetingRooms'

export function useAvailableMeetingRoomsQuery(
  params?: {
    date?: string
    startAt?: string
    endAt?: string
    capacity?: number
    page?: number
    size?: number
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: meetingKeys.availableRooms(params),
    queryFn: () => getAvailableMeetingRooms(params ?? {}),
    enabled: options?.enabled ?? false,
    placeholderData: keepPreviousData,
  })
}
