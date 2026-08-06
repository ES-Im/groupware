import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { registerCompany } from './registerCompany'

export function useCompanyRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerCompany,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
