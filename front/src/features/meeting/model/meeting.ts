export interface MyMeetingReservationCalendarItem {
  meetingId: number
  meetingRoomId: number
  meetingRoomName: string
  reserverId: number
  reserverDeptName: string
  reserverEmpName: string
  title: string
  meetingDate: string
  startAt: string
  endAt: string
  isCanceled: boolean
  participantCount: number
}

export interface MeetingRoomDetail {
  meetingRoomId: number
  name: string
  description: string
  capacity: number
  isAvailable: boolean
}

export interface MeetingRoomFile {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

export interface MeetingRoomReservationCalendarItem {
  reserverDeptName: string
  reserverEmpName: string
  participantCount: number
  meetingDate: string
  startAt: string
  endAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface MeetingRoomSummary {
  meetingRoomId: number
  name: string
  capacity: number
  isAvailable: boolean
}

export type AvailableMeetingRoomsPage = Page<MeetingRoomSummary>

export interface AvailableMeetingRoomsSearchParams {
  date?: string
  startAt?: string
  endAt?: string
  capacity?: number
  page?: number
  size?: number
}

export interface MeetingReservationParticipant {
  empId: number
  deptName: string
  empName: string
}

export interface MeetingReservationDetail {
  meetingId: number
  meetingRoomId: number
  meetingRoomName: string
  reserverId: number
  reserverDeptName: string
  reserverEmpName: string
  title: string
  meetingDate: string
  startAt: string
  endAt: string
  isCanceled: boolean
  participantCount: number
  participants: MeetingReservationParticipant[]
}

export interface MeetingManagementItem {
  meetingId: number
  meetingRoomId: number
  meetingRoomName: string
  reserverId: number
  reserverDeptName: string
  reserverEmpName: string
  title: string
  meetingDate: string
  startAt: string
  endAt: string
  isCanceled: boolean
  participantCount: number
}

export type MeetingManagementPage = Page<MeetingManagementItem>

export interface MeetingManagementSearchParams {
  yearMonth?: string
  keyword?: string
  meetingRoomId?: number
  page?: number
  size?: number
}

export interface MeetingRoomManagementItem {
  meetingRoomId: number
  name: string
  capacity: number
  isAvailable: boolean
}

export type MeetingRoomManagementPage = Page<MeetingRoomManagementItem>

export interface MeetingRoomManagementSearchParams {
  available?: boolean
  bookedInFuture?: boolean
  page?: number
  size?: number
}
