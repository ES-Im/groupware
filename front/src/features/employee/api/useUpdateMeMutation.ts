import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { updateMe } from './updateMe'

export function useUpdateMeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.me() })
    },
  })
}
