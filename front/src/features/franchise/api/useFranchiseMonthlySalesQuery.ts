import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseMonthlySales } from './getFranchiseMonthlySales'

/**
 * 월 매출 조회 훅(`FRANCHISE_SALES_MONTHLY`, ROADMAP(FRANCHISE) T3.1).
 *
 * api 함수는 매출 기안 작성이 쓰던 기존 getFranchiseMonthlySales를 그대로 재사용하고
 * (신규 작성 금지 — 기존 소비처 무영향), queryKey도 기존 flat franchiseKeys.monthlySales를
 * 유지한다(sales.* 네임스페이스로 옮기지 않음 — T1.1-d 결정).
 *
 * franchiseId 또는 yearMonth(`yyyy-MM`)가 확정되지 않은 상태에는 enabled:false로 훅 호출을
 * 지연해 자동 조회를 막는다(useFranchiseDetailQuery와 동일 가드 패턴). queryFn은 enabled
 * 가드로 인해 두 파라미터가 확정된 경우에만 실행되므로 단언한다.
 */
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
