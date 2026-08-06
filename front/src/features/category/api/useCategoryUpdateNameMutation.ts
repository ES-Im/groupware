import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { updateCategoryName } from './updateCategoryName'

interface CategoryUpdateNameVariables {
  categoryId: number
  categoryName: string
}

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
