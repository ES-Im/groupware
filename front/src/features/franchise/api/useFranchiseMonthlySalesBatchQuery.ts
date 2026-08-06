import { useQueries } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseMonthlySales } from './getFranchiseMonthlySales'
import type { FranchiseMonthlySales } from '../model/franchise'

export function useFranchiseMonthlySalesBatchQuery(franchiseIds: number[], yearMonth: string) {
  const results = useQueries({
    queries: franchiseIds.map((franchiseId) => ({
      queryKey: franchiseKeys.monthlySales(franchiseId, yearMonth),
      queryFn: () => getFranchiseMonthlySales(franchiseId, yearMonth),
    })),
  })

  const salesByFranchiseId: Record<number, FranchiseMonthlySales> = {}
  results.forEach((result, index) => {
    if (result.data && typeof result.data === 'object') {
      salesByFranchiseId[franchiseIds[index]] = result.data
    }
  })

  return {
    salesByFranchiseId,
    isLoading: results.some((result) => result.isLoading),
  }
}
