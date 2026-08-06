import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../model/queryKeys'
import { registerCategory } from './registerCategory'

export function useCategoryRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
