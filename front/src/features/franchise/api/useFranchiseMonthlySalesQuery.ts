import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseMonthlySales } from './getFranchiseMonthlySales'

export function useFranchiseMonthlySalesQuery(
  franchiseId: number | undefined,
  yearMonth: string | undefined,
) {
  return useQuery({
    queryKey: franchiseKeys.monthlySales(franchiseId as number, yearMonth as string),
    queryFn: () => getFranchiseMonthlySales(franchiseId as number, yearMonth as string),
    enabled: franchiseId != null && yearMonth != null,
  })
}
