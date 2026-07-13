import { useQueries } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseMonthlySales } from './getFranchiseMonthlySales'
import type { FranchiseMonthlySales } from '../model/franchise'

/**
 * 여러 가맹점의 월 매출을 병렬 조회하는 훅(홈 대시보드 FRANCHISE 밴드 매출 비교 위젯 소비).
 * 가맹점별 매출 합산 전용 API가 없어(FRANCHISE_SALES_MONTHLY는 단건 조회) department 도메인의
 * useDepartmentMemberCountsQuery와 동일하게 useQueries로 franchiseId마다 개별 호출한다.
 */
export function useFranchiseMonthlySalesBatchQuery(franchiseIds: number[], yearMonth: string) {
  const results = useQueries({
    queries: franchiseIds.map((franchiseId) => ({
      queryKey: franchiseKeys.monthlySales(franchiseId, yearMonth),
      queryFn: () => getFranchiseMonthlySales(franchiseId, yearMonth),
    })),
  })

  const salesByFranchiseId: Record<number, FranchiseMonthlySales> = {}
  results.forEach((result, index) => {
    // 매출 없음(204 빈 바디)은 axios data가 빈 문자열로 들어온다(FranchiseSalesOverview 동일 실측).
    if (result.data && typeof result.data === 'object') {
      salesByFranchiseId[franchiseIds[index]] = result.data
    }
  })

  return {
    salesByFranchiseId,
    isLoading: results.some((result) => result.isLoading),
  }
}
