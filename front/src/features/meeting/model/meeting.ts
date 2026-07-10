/**
 * 내 회의 예약 캘린더 조회(`MY_MEETING_RESERVATIONS_CALENDAR`,
 * GET /api/meetings/my/reservations/calendar) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/MY_MEETING_RESERVATIONS_CALENDAR/response-fields.adoc
 * 실측 기준(추측 금지).
 */
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

/**
 * 회의실 상세 조회(`MEETING_ROOM_DETAIL`, api-endpoint.md 기능ID `MEETING_ROOM_DETAIL` →
 * `GET /api/meeting-rooms/{meetingRoomId}`) 응답 타입.
 * 필드는 back/build/generated-snippets/MEETING_ROOM_DETAIL/response-fields.adoc
 * 실측 기준(추측 금지).
 */
export interface MeetingRoomDetail {
  meetingRoomId: number
  name: string
  description: string
  capacity: number
  isAvailable: boolean
}

/**
 * 회의실 첨부파일 목록 조회(`MEETING_ROOM_FILES`, GET /api/meeting-rooms/{meetingRoomId}/files)
 * 응답 항목 타입. 필드는 back/build/generated-snippets/MEETING_ROOM_FILES/response-fields.adoc
 * 실측 기준(추측 금지) — board 도메인의 BoardFileInfo(features/board/model/board.ts)와 동형이다.
 */
export interface MeetingRoomFile {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

/**
 * 회의실 예약 캘린더 조회(`MEETING_ROOM_RESERVATIONS_CALENDAR`,
 * GET /api/meeting-rooms/{meetingRoomId}/reservations/calendar) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/MEETING_ROOM_RESERVATIONS_CALENDAR/response-fields.adoc
 * 실측 기준(추측 금지) — `meetingId`·`title`이 의도적으로 없다(PRD §계약 실측 메모: 타 부서
 * 예약의 세부를 감추고 점유 시간대만 노출하는 설계 의도). 상세(P3)로 링크할 식별자가 없다.
 */
export interface MeetingRoomReservationCalendarItem {
  reserverDeptName: string
  reserverEmpName: string
  participantCount: number
  meetingDate: string
  startAt: string
  endAt: string
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
 * board 도메인의 `Page<T>`(features/board/model/board.ts)와 동형이며, 도메인마다 독립 정의하는
 * 기존 컨벤션을 그대로 따른다.
 */
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

/**
 * 예약 가능 회의실 검색(`AVAILABLE_MEETING_ROOMS`,
 * GET /api/meeting-rooms/available) 응답 목록 항목 타입.
 * 필드는 back/build/generated-snippets/AVAILABLE_MEETING_ROOMS/response-fields.adoc
 * 실측 기준(추측 금지).
 */
export interface MeetingRoomSummary {
  meetingRoomId: number
  name: string
  capacity: number
  isAvailable: boolean
}

/** `AVAILABLE_MEETING_ROOMS` 응답 전체. */
export type AvailableMeetingRoomsPage = Page<MeetingRoomSummary>

/**
 * 예약 가능 회의실 검색 쿼리 파라미터(§참조 계약 매핑 · query-parameters.adoc 실측).
 * date/startAt/endAt/capacity 4개는 계약상 전부 필수다. 시각은 PRD Open Q#5 확정대로
 * `HH:mm`로 전송한다.
 */
export interface AvailableMeetingRoomsSearchParams {
  date: string
  startAt: string
  endAt: string
  capacity: number
  page?: number
  size?: number
}

/**
 * 회의 예약 상세 조회(`MEETING_RESERVATION_DETAIL`, api-endpoint.md 기능ID
 * `MEETING_RESERVATION_DETAIL` → `GET /api/meetings/{meetingId}`) 응답의 참여자 항목 타입.
 * 필드는 back/build/generated-snippets/MEETING_RESERVATION_DETAIL/response-fields.adoc
 * 실측 기준(추측 금지).
 */
export interface MeetingReservationParticipant {
  empId: number
  deptName: string
  empName: string
}

/**
 * 회의 예약 상세 조회(`MEETING_RESERVATION_DETAIL`, GET /api/meetings/{meetingId}) 응답 타입.
 * 필드는 back/build/generated-snippets/MEETING_RESERVATION_DETAIL/response-fields.adoc
 * 실측 기준(추측 금지).
 */
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

/**
 * 회의 예약 관리 목록 조회(`MEETING_RESERVATION_MANAGEMENT`, api-endpoint.md 기능ID
 * `MEETING_RESERVATION_MANAGEMENT` → `GET /api/meetings`) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/MEETING_RESERVATION_MANAGEMENT/response-fields.adoc
 * 실측 기준(추측 금지) — MyMeetingReservationCalendarItem과 동형이다.
 */
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

/** `MEETING_RESERVATION_MANAGEMENT` 응답 전체. */
export type MeetingManagementPage = Page<MeetingManagementItem>

/**
 * 회의 예약 관리 목록 조회 쿼리 파라미터(§참조 계약 매핑 · query-parameters.adoc 실측).
 * yearMonth/keyword/meetingRoomId/page/size 전부 선택값이다.
 */
export interface MeetingManagementSearchParams {
  yearMonth?: string
  keyword?: string
  meetingRoomId?: number
  page?: number
  size?: number
}

/**
 * 회의실 관리 목록 조회(`MEETING_ROOM_MANAGEMENT`, api-endpoint.md 기능ID
 * `MEETING_ROOM_MANAGEMENT` → `GET /api/meeting-rooms/management`) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/MEETING_ROOM_MANAGEMENT/response-fields.adoc
 * 실측 기준(추측 금지) — MeetingRoomSummary와 동형이다.
 */
export interface MeetingRoomManagementItem {
  meetingRoomId: number
  name: string
  capacity: number
  isAvailable: boolean
}

/** `MEETING_ROOM_MANAGEMENT` 응답 전체. */
export type MeetingRoomManagementPage = Page<MeetingRoomManagementItem>

/**
 * 회의실 관리 목록 조회 쿼리 파라미터(§참조 계약 매핑 · query-parameters.adoc 실측).
 * available/bookedInFuture/page/size 전부 선택값이다.
 */
export interface MeetingRoomManagementSearchParams {
  available?: boolean
  bookedInFuture?: boolean
  page?: number
  size?: number
}
