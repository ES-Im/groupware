import { apiClient } from '@/shared/api/client'
import { isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import type { CompanyInfoResponse } from '../model/companyInfo'

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
