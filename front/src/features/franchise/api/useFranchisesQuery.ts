import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchises } from './getFranchises'

/**
 * 가맹점 목록 조회 훅(`FRANCHISE_LIST`, ROADMAP(SALES) T1.1).
 * FranchisePicker(T1.2)가 담당 기본뷰(managerId)·전체 검색(keyword) 두 모드를 이 훅 하나로
 * 전환한다. params(keyword/status/managerId/page/size)는 queryKey에 그대로 포함되어 값이
 * 바뀔 때마다 재요청된다.
 *
 * placeholderData: keepPreviousData로 담당 기본뷰↔검색 모드 전환 시 새 응답이 도착하기 전까지
 * 이전 목록을 유지해 화면이 매번 "불러오는 중..."으로 전면 교체되는 깜빡임을 막는다
 * (useDepartmentsQuery 동형).
 *
 * options.enabled: managerId를 다른 쿼리(예: 본인 empId) 확정 후에만 채울 수 있는 호출부용 게이팅.
 * keepPreviousData 특성상 표시 단에서만 managerId != null을 가드해도 쿼리 자체는 undefined
 * managerId로 이미 발동해(필터 없는 전체 목록) 캐시에 얹히고, 이후 managerId가 확정되는 전환
 * 순간 placeholder로 잠깐 노출될 수 있다 — 반드시 enabled로 쿼리 자체를 막아야 한다(홈 대시보드
 * FRANCHISE 밴드 위젯 리뷰에서 발견).
 */
export function useFranchisesQuery(
  params?: {
    keyword?: string
    status?: string
    managerId?: number
    page?: number
    size?: number
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: franchiseKeys.list(params),
    queryFn: () => getFranchises(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  })
}
