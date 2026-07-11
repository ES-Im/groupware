import { useMutation } from '@tanstack/react-query'
import { createManualSchedule } from './createManualSchedule'

/**
 * 수기 일정 등록 mutation 훅(`MANUAL_SCHEDULE_CREATE`, ROADMAP(SCHEDULE) T3.1).
 * invalidate는 여기서 처리하지 않는다 — 소비처(T3.3 ScheduleCreateDialog)가 onSuccess에서
 * scheduleKeys.calendar를 직접 invalidate한다(훅은 순수 mutation만 제공).
 */
export function useCreateManualScheduleMutation() {
  return useMutation({
    mutationFn: createManualSchedule,
  })
}
