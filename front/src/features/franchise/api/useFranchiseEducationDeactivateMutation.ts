import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { deactivateFranchiseEducation } from './toggleFranchiseEducationActive'

/**
 * 교육 비활성화 mutation 훅(`FRANCHISE_EDUCATION_DEACTIVATE`, ROADMAP(FRANCHISE) T4.4, F1614).
 * invalidate 대상·근거는 useFranchiseEducationActivateMutation과 동일하다(상세 + 캘린더 접두사).
 * 실패 시 에러는 그대로 던져 호출부가 handleApiError로 위임하도록 둔다.
 */
export function useFranchiseEducationDeactivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (educationId: number) => deactivateFranchiseEducation(educationId),
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
