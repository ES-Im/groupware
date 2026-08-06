import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseYearlySales } from './getFranchiseYearlySales'

export function useFranchiseYearlySalesQuery(
  franchiseId: number | undefined,
  year: number | undefined,
) {
  return useQuery({
    queryKey: franchiseKeys.sales.yearly(franchiseId as number, year as number),
    queryFn: () => getFranchiseYearlySales(franchiseId as number, year as number),
    enabled: franchiseId != null && year != null,
  })
}
