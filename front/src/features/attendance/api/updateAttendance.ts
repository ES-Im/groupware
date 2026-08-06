import { apiClient } from '@/shared/api/client'
import type { UpdateAttendanceFormValues } from '../model/updateAttendanceSchema'

export type UpdateAttendanceRequest = UpdateAttendanceFormValues & { editedAt: string }

export async function updateAttendance(
  attendanceId: number,
  payload: UpdateAttendanceRequest,
): Promise<void> {
  const body: Record<string, unknown> = {
    targetEmpId: payload.targetEmpId,
    editedAt: payload.editedAt,
    editReason: payload.editReason,
  }
  if (payload.startAt) {
    body.startAt = payload.startAt
  }
  if (payload.endAt) {
    body.endAt = payload.endAt
  }
  await apiClient.patch(`/api/employees/attendances/${attendanceId}`, body)
}
