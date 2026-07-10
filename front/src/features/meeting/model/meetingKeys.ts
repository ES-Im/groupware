import type { CalendarRangeParams } from '../lib/calendarRange'

/**
 * meeting 도메인 queryKey 팩토리(ROADMAP T1.1 / §참조 계약 매핑 / §기술 스택).
 * boardKeys(@/features/board/model/queryKeys)와 동형 구조 — all을 배열 리터럴로
 * 고정해 invalidateQueries(meetingKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * myReservationsCalendar(range)는 T1.3(F800 내 예약 캘린더), roomDetail/roomReservationsCalendar는
 * T2.1/T2.3(F807/F809 회의실 열람), roomFiles는 T2.2(F808 회의실 이미지), availableRooms는
 * T3.1(F802 예약 가능 회의실 검색),
 * reservationDetail은 T4.1(F801 예약 상세), managementReservations는 T5.1(F810 예약 관리 목록),
 * roomManagement는 M6(F811 회의실 관리 목록)에서 실제로 소비된다. 이 태스크(T1.1)는 시그니처만
 * 먼저 고정하고, 이를 사용하는 조회 훅 구현은 각 후속 태스크가 채운다(재설계 없이 그대로
 * 재사용될 형태로 미리 고정 — board list/detail/editMode 선례와 동일).
 *
 * roomDetail/reservationDetail은 id가 아직 확정되지 않은 상태(예: 라우트 파라미터 파싱 전)에서도
 * 소비 훅이 enabled:false로 대기하며 queryKey를 구성할 수 있도록 number | undefined를 받는다
 * (boardKeys.detail/departmentKeys.detail과 동일 이유).
 *
 * myReservationsCalendar/roomReservationsCalendar의 range는 calendarRange.ts의
 * buildCalendarRangeParams 반환 타입(CalendarRangeParams)을 그대로 재사용해 캘린더 유틸과
 * queryKey 파라미터 타입이 어긋나지 않게 한다.
 */
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
