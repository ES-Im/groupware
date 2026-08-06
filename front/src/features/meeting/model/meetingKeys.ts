import type { CalendarRangeParams } from '../lib/calendarRange'

export const meetingKeys = {
  all: ['meeting'] as const,
  myReservationsCalendar: (range?: CalendarRangeParams) =>
    [...meetingKeys.all, 'myReservationsCalendar', range] as const,
  roomDetail: (meetingRoomId: number | undefined) =>
    [...meetingKeys.all, 'roomDetail', meetingRoomId] as const,
  roomReservationsCalendar: (meetingRoomId: number | undefined, range?: CalendarRangeParams) =>
    [...meetingKeys.all, 'roomReservationsCalendar', meetingRoomId, range] as const,
  roomFiles: (meetingRoomId: number | undefined) =>
    [...meetingKeys.all, 'roomFiles', meetingRoomId] as const,
  availableRooms: (params?: {
    date?: string
    startAt?: string
    endAt?: string
    capacity?: number
    page?: number
    size?: number
  }) => [...meetingKeys.all, 'availableRooms', params] as const,
  reservationDetail: (meetingId: number | undefined) =>
    [...meetingKeys.all, 'reservationDetail', meetingId] as const,
  managementReservations: (params?: {
    yearMonth?: string
    keyword?: string
    meetingRoomId?: number
    page?: number
    size?: number
  }) => [...meetingKeys.all, 'managementReservations', params] as const,
  roomManagement: (params?: { available?: boolean; bookedInFuture?: boolean; page?: number; size?: number }) =>
    [...meetingKeys.all, 'roomManagement', params] as const,
}
