import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { deactivateCategory } from './toggleCategoryVisibility'

/**
 * 카테고리 숨김 mutation 훅(`CATEGORY_DEACTIVATE`, ADMIN 전용). invalidate 근거는
 * useCategoryActivateMutation과 동일하다(categoryKeys.all 전체).
 */
export function useCategoryDeactivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: number) => deactivateCategory(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
