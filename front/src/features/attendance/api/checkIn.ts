import { apiClient } from '@/shared/api/client'

export async function checkIn(): Promise<void> {
  await apiClient.post('/api/employees/attendances/me/check-in')
}
