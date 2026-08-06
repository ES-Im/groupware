import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { activateCategory } from './toggleCategoryVisibility'

export function useCategoryActivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: number) => activateCategory(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
