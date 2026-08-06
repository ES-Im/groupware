import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'
import type { CompanyRegisterFormValues } from '../model/companyRegisterSchema'

export async function registerCompany(payload: CompanyRegisterFormValues): Promise<void> {
  await apiClient.post('/api/companies/new', {
    ...payload,
    editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
  })
}
