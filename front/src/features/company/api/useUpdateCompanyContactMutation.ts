import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { updateCompanyContact } from './updateCompanyContact'

export function useUpdateCompanyContactMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCompanyContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
