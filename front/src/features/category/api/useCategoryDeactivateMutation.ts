import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { deactivateCategory } from './toggleCategoryVisibility'

export function useCategoryDeactivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: number) => deactivateCategory(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
