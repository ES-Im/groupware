import { apiClient } from '@/shared/api/client'
import type { FranchiseCreateRequest, FranchiseCreateResponse } from '../model/franchise'

/**
 * 가맹점 등록(`FRANCHISE_CREATE`, api-endpoint.md 기능ID `FRANCHISE_CREATE` →
 * `POST /api/franchises`, minRole FRANCHISE 또는 ADMIN). 성공 시 `201 Created` +
 * `{ franchiseId }`(response-fields.adoc 실측 — 목록/상세의 `id`와 키가 다름에 주의).
 *
 * managerEmpId는 선택 필드라 미지정 시 body 키 자체를 생략한다(getFranchises 쿼리 조건부
 * 채움 패턴 동형). 이메일 중복 등 서버 도메인 판정 실패는 그대로 던져 호출부(T2.2 다이얼로그)가
 * handleApiError로 위임하도록 둔다.
 */
export async function createFranchise(
  payload: FranchiseCreateRequest,
): Promise<FranchiseCreateResponse> {
  const body: FranchiseCreateRequest = {
    businessNumber: payload.businessNumber,
    franchiseName: payload.franchiseName,
    address: payload.address,
    ownerName: payload.ownerName,
    contactNumber: payload.contactNumber,
    contactEmail: payload.contactEmail,
  }
  if (payload.managerEmpId != null) {
    body.managerEmpId = payload.managerEmpId
  }
  const { data } = await apiClient.post<FranchiseCreateResponse>('/api/franchises', body)
  return data
}
