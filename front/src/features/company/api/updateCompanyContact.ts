import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'
import type { CompanyContactUpdateFormValues } from '../model/companyContactUpdateSchema'

export async function updateCompanyContact(values: CompanyContactUpdateFormValues): Promise<void> {
  const body: Record<string, unknown> = {
    editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  }
  if (values.presentedEmail) {
    body.presentedEmail = values.presentedEmail
  }
  if (values.presentedExternalNo) {
    body.presentedExternalNo = values.presentedExternalNo
  }
  await apiClient.post('/api/companies/contact', body)
}
