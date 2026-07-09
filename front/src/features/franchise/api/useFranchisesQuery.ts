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
 */
export function useFranchisesQuery(params?: {
  keyword?: string
  status?: string
  managerId?: number
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: franchiseKeys.list(params),
    queryFn: () => getFranchises(params),
    placeholderData: keepPreviousData,
  })
}
