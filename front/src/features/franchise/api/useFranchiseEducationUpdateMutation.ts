import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import {
  updateFranchiseEducation,
  type FranchiseEducationUpdatePayload,
} from './updateFranchiseEducation'

/** useFranchiseEducationUpdateMutation 호출 변수. */
interface FranchiseEducationUpdateVariables {
  educationId: number
  payload: FranchiseEducationUpdatePayload
}

/**
 * 교육 수정 mutation 훅(`FRANCHISE_EDUCATION_UPDATE`, ROADMAP(FRANCHISE) T4.4, F1613).
 * 성공(204) 시 교육 상세(`franchiseKeys.education.detail`)와 캘린더 접두사
 * (`[...all, 'education', 'calendar']`)를 함께 invalidate한다 — 일시/장소/제목은 캘린더(P4)
 * 이벤트에도 노출되는 필드고, 캘린더 키는 start/end 파라미터가 채워져 있어 인자 없는
 * `education.calendar()` 호출로는 partial match되지 않는다(useMeetingRoomActivateMutation의
 * roomManagement 접두사와 동일 근거). 실패 시 에러는 그대로 던져 호출부가 handleApiError로
 * 위임하도록 둔다.
 */
export function useFranchiseEducationUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ educationId, payload }: FranchiseEducationUpdateVariables) =>
      updateFranchiseEducation(educationId, payload),
    onSuccess: async (_data, { educationId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.education.detail(educationId) }),
        queryClient.invalidateQueries({
          queryKey: [...franchiseKeys.all, 'education', 'calendar'],
        }),
      ])
    },
  })
}
