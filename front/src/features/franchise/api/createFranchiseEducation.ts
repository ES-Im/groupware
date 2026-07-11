import { apiClient } from '@/shared/api/client'
import type { FranchiseEducationCreateRequest, FranchiseEducationCreateResponse } from '../model/franchise'

/**
 * 교육 등록(`FRANCHISE_EDUCATION_CREATE`, api-endpoint.md 기능ID `FRANCHISE_EDUCATION_CREATE` →
 * `POST /api/franchise-educations`). 성공 시 `201 Created` + `{ educationId }`
 * (response-fields.adoc 실측). 서버가 비활성 상태로 생성하므로(도메인 규칙) 별도 활성 처리는 하지 않는다.
 * 검증 실패 등은 그대로 던져 호출부(T4.2 FranchiseEducationCreateDialog)가 handleApiError로 위임하도록 둔다.
 */
export async function createFranchiseEducation(
  payload: FranchiseEducationCreateRequest,
): Promise<FranchiseEducationCreateResponse> {
  const { data } = await apiClient.post<FranchiseEducationCreateResponse>('/api/franchise-educations', payload)
  return data
}
