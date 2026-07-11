import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ScheduleScope } from '../lib/scheduleTypes'
import { scheduleKeys } from '../model/scheduleKeys'
import { cancelSchedule } from './cancelSchedule'

interface CancelScheduleVariables {
  scheduleId: number
  scope?: ScheduleScope
}

/**
 * 일정 취소 mutation 훅(`SCHEDULE_CANCEL`, ROADMAP(SCHEDULE) T6.1).
 * 성공 시 해당 일정 상세(scheduleKeys.detail)와 캘린더(scheduleKeys.calendar)를 invalidate한다.
 */
export function useCancelScheduleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scheduleId, scope }: CancelScheduleVariables) => cancelSchedule(scheduleId, scope),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(variables.scheduleId) })
      // scheduleKeys.calendar()는 인자 없이 호출 시 2칸 프리픽스 키를 반환하도록 T1.1에서 수정됐다
      // (scheduleKeys.ts 주석 참조) — 구체 params를 가진 실제 캘린더 쿼리와 partial match로 정상 매칭된다.
      queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
    },
  })
}
