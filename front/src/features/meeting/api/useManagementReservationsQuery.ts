import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { meetingKeys } from '../model/meetingKeys'
import type { MeetingManagementSearchParams } from '../model/meeting'
import { getManagementReservations } from './getManagementReservations'

export function useManagementReservationsQuery(params?: MeetingManagementSearchParams) {
  return useQuery({
    queryKey: meetingKeys.managementReservations(params),
    queryFn: () => getManagementReservations(params),
    placeholderData: keepPreviousData,
  })
}
