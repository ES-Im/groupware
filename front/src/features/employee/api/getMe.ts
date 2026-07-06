import { apiClient } from '@/shared/api/client'
import type { MeResponse } from '../model/me'

/**
 * 본인 정보 조회(`RETRIEVE_ME_INFO`, api-endpoint.md EMP_ACCOUNT API 섹션).
 * `/api/auth/me`는 존재하지 않는다 — 본인 상세는 항상 이 엔드포인트를 사용한다(ROADMAP T1.3/T2.3 주석).
 */
export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/api/employees/me')
  return data
}
