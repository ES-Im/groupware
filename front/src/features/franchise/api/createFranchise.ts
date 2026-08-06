import { apiClient } from '@/shared/api/client'
import type { FranchiseCreateRequest, FranchiseCreateResponse } from '../model/franchise'

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
