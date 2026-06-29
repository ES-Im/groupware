/**
 * 일정/회의 더미 데이터 (Schedule / Meeting / MeetingRoom)
 * 실제 연동 시 services/schedule.js 메서드 반환값으로 교체.
 */

// SCHEDULE_CALENDAR — FullCalendar 이벤트 형태로 가공한 더미
export const scheduleEvents = [
  { id: 's1', title: '주간 팀 회의', start: '2026-06-29T10:00:00', end: '2026-06-29T11:00:00', className: 'bg-primary' },
  { id: 's2', title: '연차 (김하루)', start: '2026-06-15', end: '2026-06-17', className: 'bg-success' },
  { id: 's3', title: '가맹점 교육', start: '2026-06-24T14:00:00', end: '2026-06-24T17:00:00', className: 'bg-info' },
  { id: 's4', title: '부산 출장', start: '2026-06-20', end: '2026-06-22', className: 'bg-warning' },
  { id: 's5', title: '월말 결산', start: '2026-06-30T09:00:00', end: '2026-06-30T12:00:00', className: 'bg-danger' },
];

// 회의 예약 상태
export const MEETING_STATUS_META = {
  RESERVED: { label: '예약', variant: 'primary' },
  IN_PROGRESS: { label: '진행중', variant: 'info' },
  DONE: { label: '완료', variant: 'secondary' },
  CANCELED: { label: '취소', variant: 'danger' },
};

// MY_MEETING_RESERVATIONS — 목록
export const meetings = [
  { meetingId: 1, title: '신제품 기획 회의', roomName: '대회의실 A', startAt: '2026-06-29 10:00', endAt: '2026-06-29 11:30', participants: 6, status: 'RESERVED' },
  { meetingId: 2, title: '개발 스프린트 리뷰', roomName: '소회의실 B', startAt: '2026-06-29 14:00', endAt: '2026-06-29 15:00', participants: 4, status: 'RESERVED' },
  { meetingId: 3, title: '영업 전략 미팅', roomName: '대회의실 A', startAt: '2026-06-27 13:00', endAt: '2026-06-27 14:00', participants: 8, status: 'DONE' },
  { meetingId: 4, title: '1:1 면담', roomName: '포커스룸 C', startAt: '2026-06-26 16:00', endAt: '2026-06-26 16:30', participants: 2, status: 'CANCELED' },
];

// MEETING_ROOM_MANAGEMENT — 회의실 목록
export const meetingRooms = [
  { meetingRoomId: 1, name: '대회의실 A', capacity: 20, location: '본사 3층', active: true, equipment: '빔프로젝터, 화상회의' },
  { meetingRoomId: 2, name: '소회의실 B', capacity: 8, location: '본사 3층', active: true, equipment: '화이트보드' },
  { meetingRoomId: 3, name: '포커스룸 C', capacity: 4, location: '본사 4층', active: true, equipment: 'TV 모니터' },
  { meetingRoomId: 4, name: '세미나실 D', capacity: 40, location: '본사 5층', active: false, equipment: '음향, 빔프로젝터' },
];
