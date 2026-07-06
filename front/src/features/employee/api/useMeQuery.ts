import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getMe } from './getMe'

/**
 * 본인 정보(me) 조회 훅(ROADMAP T1.3).
 * 헤더 사용자 표시(T1.6)·세션 복원(T1.4)·M2 내 정보 조회(T2.3)가 공유하는 기반 훅이므로
 * 별도 옵션 없이 employeeKeys.me() 키로만 캐시하고, 소비처가 필요에 맞게 결과를 사용한다.
 */
export function useMeQuery() {
  return useQuery({
    queryKey: employeeKeys.me(),
    queryFn: getMe,
  })
}
