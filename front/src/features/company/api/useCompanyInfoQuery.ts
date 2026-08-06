import { useQuery } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { getCompanyInfo } from './getCompanyInfo'

export function useCompanyInfoQuery() {
  return useQuery({
    queryKey: companyKeys.info(),
    queryFn: getCompanyInfo,
  })
}
