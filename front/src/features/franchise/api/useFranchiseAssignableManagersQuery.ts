import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseAssignableManagers } from './getFranchiseAssignableManagers'

/**
 * 가맹점 배정 후보(FRANCHISE 권한 사원) 조회 훅(`FRANCHISE_ASSIGNABLE_MANAGERS`).
 * 배정 picker(FranchiseManagerPicker)가 마운트되는 동안에만 활성이며(다이얼로그가 닫히면 언마운트),
 * 파라미터가 없고 값이 자주 바뀌지 않아 기본 캐시 정책으로 충분하다. 실패는 소비 컴포넌트가 처리한다.
 */
export function useFranchiseAssignableManagersQuery() {
  return useQuery({
    queryKey: franchiseKeys.assignableManagers(),
    queryFn: getFranchiseAssignableManagers,
  })
}
