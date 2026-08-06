import { apiClient } from '@/shared/api/client'
import type { RegisterFormValues } from '../model/registerSchema'

export async function register(values: RegisterFormValues): Promise<void> {
  await apiClient.post('/api/employees', values)
}
