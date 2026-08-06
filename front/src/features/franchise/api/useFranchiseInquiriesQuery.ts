import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseInquiries } from './getFranchiseInquiries'

export function useFranchiseInquiriesQuery(params?: {
  isAnswered?: boolean
  assignedManagerId?: number
  keyword?: string
  from?: string
  to?: string
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: franchiseKeys.inquiry.list(params),
    queryFn: () => getFranchiseInquiries(params),
    placeholderData: keepPreviousData,
  })
}
