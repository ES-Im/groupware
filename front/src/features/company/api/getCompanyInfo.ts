import { apiClient } from '@/shared/api/client'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import type { CompanyInfoResponse } from '../model/companyInfo'

/**
 * 회사 정보 조회(`COMPANY_INFO`, GET /api/companies, permitAll).
 *
 * 로컬 개발 DB가 회사 미등록 상태일 수 있는 정상 시나리오라(§ROADMAP M1 배경),
 * 404는 조회 실패가 아니라 "미등록"으로 취급해 null을 반환한다(throw하지 않음).
 * 그 외 실패(네트워크 오류 등)는 그대로 throw해 handleApiError 위임 경로를 유지한다.
 */
export async function getCompanyInfo(): Promise<CompanyInfoResponse | null> {
  try {
    const { data } = await apiClient.get<CompanyInfoResponse>('/api/companies')
    return data
  } catch (error) {
    if (isNotFound(normalizeApiError(error))) {
      return null
    }
    throw error
  }
}
