import { useQuery } from '@tanstack/react-query'
import { companyKeys } from '../model/companyKeys'
import { getCompanyInfo } from './getCompanyInfo'

/**
 * 회사 정보 조회 훅(ROADMAP-COMPANY.md T1.1, F1401).
 *
 * getCompanyInfo가 404를 null로 정규화하므로 data===null은 쿼리 실패가 아니라
 * "미등록" 상태다 — 컴포넌트는 isLoading/error/data(null 여부) 3가지로 분기하면 된다.
 * 그 외 실패만 query.error로 전파되어 handleApiError 위임 경로를 그대로 유지한다.
 */
export function useCompanyInfoQuery() {
  return useQuery({
    queryKey: companyKeys.info(),
    queryFn: getCompanyInfo,
  })
}
