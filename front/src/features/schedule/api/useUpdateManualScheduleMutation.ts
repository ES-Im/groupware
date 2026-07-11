import { useMutation } from '@tanstack/react-query'
import { updateManualSchedule } from './updateManualSchedule'
import type { ManualScheduleUpdatePayload, ScheduleScope } from '../lib/scheduleTypes'

/** useUpdateManualScheduleMutation 호출 변수. */
interface UpdateManualScheduleVariables {
  scheduleId: number
  payload: ManualScheduleUpdatePayload
  scope?: ScheduleScope
}

/**
 * 수기 일정 수정 mutation 훅(`MANUAL_SCHEDULE_UPDATE`, ROADMAP(SCHEDULE) T4.1).
 * invalidate는 여기서 처리하지 않는다 — 소비처(T4.3 ScheduleDetailDialog)가 onSuccess에서
 * scheduleKeys.detail/calendar를 직접 invalidate한다(훅은 순수 mutation만 제공,
 * useCreateManualScheduleMutation 선례와 동일).
 */
export function useUpdateManualScheduleMutation() {
  return useMutation({
    mutationFn: ({ scheduleId, payload, scope }: UpdateManualScheduleVariables) =>
      updateManualSchedule(scheduleId, payload, scope),
  })
}
