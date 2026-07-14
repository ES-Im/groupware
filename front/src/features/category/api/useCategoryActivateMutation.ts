import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { activateCategory } from './toggleCategoryVisibility'

/**
 * 카테고리 노출 mutation 훅(`CATEGORY_ACTIVATE`, ADMIN 전용). invalidate 근거는
 * useCategoryRegisterMutation과 동일하다(categoryKeys.all 전체 — 관리 목록 + 노출 목록 동시 갱신,
 * isVisible이 두 목록 모두의 필터/노출 축이기 때문).
 */
export function useCategoryActivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: number) => activateCategory(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
