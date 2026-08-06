import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'
import type { CompanyHomePageUpdateFormValues } from '../model/companyHomePageUpdateSchema'

export async function updateCompanyHomePageURL(
  payload: CompanyHomePageUpdateFormValues,
): Promise<void> {
  await apiClient.post('/api/companies/home-page-url', {
    ...payload,
    editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  })
}
