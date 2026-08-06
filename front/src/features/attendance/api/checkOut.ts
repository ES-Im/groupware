import { apiClient } from '@/shared/api/client'

export async function checkOut(): Promise<void> {
  await apiClient.patch('/api/employees/attendances/me/check-out')
}
