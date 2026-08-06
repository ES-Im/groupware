import { useQuery } from '@tanstack/react-query'
import { scheduleKeys } from '../model/scheduleKeys'
import { getScheduleDetail } from './getScheduleDetail'

export function useScheduleDetailQuery(scheduleId: number | undefined) {
  return useQuery({
    queryKey: scheduleKeys.detail(scheduleId),
    queryFn: () => getScheduleDetail(scheduleId as number),
    enabled: scheduleId !== undefined,
  })
}
