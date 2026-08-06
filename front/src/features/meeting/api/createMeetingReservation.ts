import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'

export interface MeetingReservationCreatePayload {
  meetingRoomId: number
  reserverId: number
  title: string
  meetingDate: string
  startAt: string
  endAt: string
  participantIds: number[]
}

export function formatMeetingTimeOfDay(value: Date): string {
  return dayjs(value).format('HH:mm')
}

export async function createMeetingReservation(payload: MeetingReservationCreatePayload): Promise<void> {
  await apiClient.post('/api/meetings', payload)
}
