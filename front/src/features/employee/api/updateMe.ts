import { apiClient } from '@/shared/api/client'
import type { UpdateMeFormValues } from '../model/updateMeSchema'

export async function updateMe(values: UpdateMeFormValues): Promise<void> {
  await apiClient.patch('/api/employees/me', values)
}
