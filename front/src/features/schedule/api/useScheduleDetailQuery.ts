import { useQuery } from '@tanstack/react-query'
import { scheduleKeys } from '../model/scheduleKeys'
import { getScheduleDetail } from './getScheduleDetail'

/**
 * 일정 상세 조회 훅(ROADMAP(SCHEDULE) T2.1, F002).
 * scheduleId가 undefined이면 대기(enabled:false)하고, 값이 주어지면 상세를 조회한다.
 */
export function useScheduleDetailQuery(scheduleId: number | undefined) {
  return useQuery({
    queryKey: scheduleKeys.detail(scheduleId),
    queryFn: () => getScheduleDetail(scheduleId as number),
    enabled: scheduleId !== undefined,
  })
}
