import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { MeetingRoomManagementSearchParams } from '../model/meeting'
import { getMeetingRoomManagementList } from './getMeetingRoomManagementList'

export function useMeetingRoomManagementListQuery(params?: MeetingRoomManagementSearchParams) {
  return useQuery({
    queryKey: meetingKeys.roomManagement(params),
    queryFn: () => getMeetingRoomManagementList(params),
    placeholderData: keepPreviousData,
  })
}
