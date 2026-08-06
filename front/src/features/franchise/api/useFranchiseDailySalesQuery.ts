import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseDailySales } from './getFranchiseDailySales'

export function useFranchiseDailySalesQuery(
  franchiseId: number | undefined,
  date: string | undefined,
) {
  return useQuery({
    queryKey: franchiseKeys.sales.daily(franchiseId as number, date as string),
    queryFn: () => getFranchiseDailySales(franchiseId as number, date as string),
    enabled: franchiseId != null && date != null,
  })
}
