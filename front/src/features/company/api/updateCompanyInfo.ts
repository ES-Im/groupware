import { apiClient } from '@/shared/api/client'
import type { CompanyInfoUpdateFormValues } from '../model/companyInfoUpdateSchema'

export type UpdateCompanyInfoRequest = CompanyInfoUpdateFormValues & { editedAt: string }

export async function updateCompanyInfo(payload: UpdateCompanyInfoRequest): Promise<void> {
  const body: Record<string, unknown> = { editedAt: payload.editedAt }
  if (payload.companyName) {
    body.companyName = payload.companyName
  }
  if (payload.location) {
    body.location = payload.location
  }
  if (payload.ownerName) {
    body.ownerName = payload.ownerName
  }
  await apiClient.post('/api/companies/info', body)
}
