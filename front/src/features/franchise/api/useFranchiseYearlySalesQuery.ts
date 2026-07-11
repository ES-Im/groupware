import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseYearlySales } from './getFranchiseYearlySales'

/**
 * 연 매출 조회 훅(`FRANCHISE_SALES_YEARLY`, ROADMAP(FRANCHISE) T3.1).
 *
 * franchiseId 또는 year가 아직 확정되지 않은 상태(예: 매출 조회 페이지에서 가맹점 미선택)에는
 * enabled:false로 훅 호출을 지연해 자동 조회를 막는다(useFranchiseDetailQuery와 동일 가드 패턴).
 * queryFn은 enabled 가드로 인해 두 파라미터가 확정된 경우에만 실행되므로 단언한다.
 */
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
