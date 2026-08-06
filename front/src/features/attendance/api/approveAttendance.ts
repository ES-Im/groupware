import { apiClient } from '@/shared/api/client'

export async function approveAttendance(
  attendanceId: number,
  targetEmpId: number,
  approvedAt: string,
): Promise<void> {
  await apiClient.patch(`/api/employees/attendances/${attendanceId}/approval`, null, {
    params: { targetEmpId, approvedAt },
  })
}
