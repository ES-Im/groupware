import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { createFranchiseEducation } from './createFranchiseEducation'

/**
 * 교육 등록 mutation 훅(`FRANCHISE_EDUCATION_CREATE`, ROADMAP(FRANCHISE) T4.2, F1612).
 * 성공(201) 시 교육 캘린더(F1609, T4.1)만 갱신 대상이므로 franchiseKeys.all 전체가 아니라
 * `[...franchiseKeys.all, 'education', 'calendar']` 2단계 접두사로 invalidate한다
 * (useMeetingRoomCreateMutation과 동일 컨벤션) — franchiseKeys.education.calendar()를 인자 없이
 * 그대로 호출하면 3·4번째 원소(start/end)가 `undefined`로 고정되어, range가 채워진 실제 캐시 키와
 * partial match되지 않는다. 등록 실패는 그대로 던져 호출부(T4.2 FranchiseEducationCreateDialog)가
 * handleApiError/submitWithErrorMapping으로 위임하도록 둔다.
 */
export function useFranchiseEducationCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFranchiseEducation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...franchiseKeys.all, 'education', 'calendar'] })
    },
  })
}
