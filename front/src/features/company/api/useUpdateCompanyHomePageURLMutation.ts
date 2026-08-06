import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { updateCompanyHomePageURL } from './updateCompanyHomePageURL'

export function useUpdateCompanyHomePageURLMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCompanyHomePageURL,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
