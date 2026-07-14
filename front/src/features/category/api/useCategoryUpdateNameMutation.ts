import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { updateCategoryName } from './updateCategoryName'

/** useCategoryUpdateNameMutation 호출 변수. */
interface CategoryUpdateNameVariables {
  categoryId: number
  categoryName: string
}

/**
 * 카테고리명 변경 mutation 훅(`CATEGORY_UPDATE_NAME`, ADMIN 전용). invalidate 근거는
 * useCategoryRegisterMutation과 동일하다(categoryKeys.all 전체 — 관리 목록 + 노출 목록 동시 갱신).
 */
export function useCategoryUpdateNameMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, categoryName }: CategoryUpdateNameVariables) =>
      updateCategoryName(categoryId, categoryName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
