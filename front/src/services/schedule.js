/**
 * SCHEDULE / MEETING / MEETING ROOM API (rules/api-endpoint.md)
 */
import {http} from './http/client';
import {buildQuery} from './http/query';

// ── 일정 (SCHEDULE) ────────────────────────────────────────
export const getScheduleCalendar = (params) =>
  http.get(`/api/schedules/calendar${buildQuery(params)}`);
export const getSchedule = (scheduleId) => http.get(`/api/schedules/${scheduleId}`);
export const createSchedule = (body) => http.post('/api/schedules', body);
export const addScheduleParticipants = (scheduleId, scope, body) =>
  http.post(`/api/schedules/${scheduleId}/participants${buildQuery({ scope })}`, body);
export const removeScheduleParticipants = (scheduleId, scope, body) =>
  http.patch(`/api/schedules/${scheduleId}/participants${buildQuery({ scope })}`, body);
export const cancelSchedule = (scheduleId, scope) =>
  http.patch(`/api/schedules/${scheduleId}/cancellation${buildQuery({ scope })}`);
export const updateSchedule = (scheduleId, scope, body) =>
  http.patch(`/api/schedules/${scheduleId}${buildQuery({ scope })}`, body);

// ── 회의 (MEETING) ─────────────────────────────────────────
export const getMyMeetingCalendar = (params) =>
  http.get(`/api/meetings/my/reservations/calendar${buildQuery(params)}`);
export const getMeeting = (meetingId) => http.get(`/api/meetings/${meetingId}`);
export const getMeetingsForManagement = (params) =>
  http.get(`/api/meetings${buildQuery(params)}`);
export const createMeeting = (body) => http.post('/api/meetings', body);
export const replaceMeetingParticipants = (meetingId, body) =>
  http.patch(`/api/meetings/${meetingId}/participants`, body);
export const cancelMeeting = (meetingId) => http.patch(`/api/meetings/${meetingId}/cancel`);
export const updateMeeting = (meetingId, body) =>
  http.patch(`/api/meetings/${meetingId}/reservation-info`, body);

// ── 회의실 (MEETING ROOM) ──────────────────────────────────
export const getAvailableMeetingRooms = (params) =>
  http.get(`/api/meeting-rooms/available${buildQuery(params)}`);
export const getMeetingRoomsForManagement = (params) =>
  http.get(`/api/meeting-rooms/management${buildQuery(params)}`);
export const getMeetingRoomCalendar = (meetingRoomId, params) =>
  http.get(`/api/meeting-rooms/${meetingRoomId}/reservations/calendar${buildQuery(params)}`);
export const getMeetingRoom = (meetingRoomId) =>
  http.get(`/api/meeting-rooms/${meetingRoomId}`);
export const getMeetingRoomFiles = (meetingRoomId) =>
  http.get(`/api/meeting-rooms/${meetingRoomId}/files`);
export const createMeetingRoom = (body) => http.post('/api/meeting-rooms', body);
export const updateMeetingRoom = (meetingRoomId, body) =>
  http.patch(`/api/meeting-rooms/${meetingRoomId}`, body);
export const activateMeetingRoom = (meetingRoomId) =>
  http.patch(`/api/meeting-rooms/${meetingRoomId}/activate`);
export const deactivateMeetingRoom = (meetingRoomId) =>
  http.patch(`/api/meeting-rooms/${meetingRoomId}/deactivate`);
