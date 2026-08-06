import { apiClient } from '@/shared/api/client'
import type { RegisterDepartmentFormValues } from '../model/registerDepartmentSchema'

export async function registerDepartment(values: RegisterDepartmentFormValues): Promise<void> {
  await apiClient.post('/api/departments', values)
}
