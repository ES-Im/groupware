import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { CompanyInfoUpdateFormValues } from '../model/companyInfoUpdateSchema'
import { companyKeys } from '../model/companyKeys'
import { updateCompanyInfo } from './updateCompanyInfo'

export function useUpdateCompanyInfoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: CompanyInfoUpdateFormValues) =>
      updateCompanyInfo({ ...variables, editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss') }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    },
  })
}
