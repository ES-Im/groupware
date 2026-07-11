import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { activateFranchiseEducation } from './toggleFranchiseEducationActive'

/**
 * 교육 활성화 mutation 훅(`FRANCHISE_EDUCATION_ACTIVATE`, ROADMAP(FRANCHISE) T4.4, F1614).
 * 성공(204) 시 교육 상세(`franchiseKeys.education.detail`)와 캘린더 접두사
 * (`[...all, 'education', 'calendar']`)를 함께 invalidate한다 — isActive는 캘린더(P4) 이벤트
 * 표현에도 쓰이는 필드다(useFranchiseEducationUpdateMutation과 동일 접두사 근거,
 * useMeetingRoomActivateMutation 동형). 실패 시 에러는 그대로 던져 호출부가 handleApiError로
 * 위임하도록 둔다.
 */
export function useFranchiseEducationActivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (educationId: number) => activateFranchiseEducation(educationId),
    onSuccess: async (_data, educationId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: franchiseKeys.education.detail(educationId) }),
        queryClient.invalidateQueries({
          queryKey: [...franchiseKeys.all, 'education', 'calendar'],
        }),
      ])
    },
  })
}
