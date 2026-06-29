/**
 * CHAT API (rules/api-endpoint.md > BOARD / MESSAGE / CHAT API)
 *
 * 참고: 실시간 메시지 송수신은 STOMP(WebSocket) + Redis Pub/Sub로 처리하며,
 * 아래 REST API는 방 목록/상세/이력 조회 및 방 관리(초대/나가기/읽음위치 등)를 담당한다.
 */
import {http} from './http/client';
import {buildQuery} from './http/query';

export const getChatRooms = (params) =>
  http.get(`/api/chat/rooms${buildQuery(params)}`);
export const getChatRoom = (roomId) => http.get(`/api/chat/rooms/${roomId}`);
export const getChatMessages = (roomId, params) =>
  http.get(`/api/chat/rooms/${roomId}/messages${buildQuery(params)}`);
export const createChatRoom = (body) => http.post('/api/chat/rooms', body);
export const inviteChatMembers = (roomId, body) =>
  http.patch(`/api/chat/rooms/${roomId}/invite`, body);
export const updateChatRoomName = (roomId, body) =>
  http.patch(`/api/chat/rooms/${roomId}/name`, body);
export const leaveChatRoom = (roomId) => http.patch(`/api/chat/rooms/${roomId}/leave`);
export const bookmarkChatRoom = (roomId) => http.patch(`/api/chat/rooms/${roomId}/bookmark`);
export const unbookmarkChatRoom = (roomId) =>
  http.patch(`/api/chat/rooms/${roomId}/unbookmark`);
export const updateChatReadPosition = (roomId, body) =>
  http.patch(`/api/chat/rooms/${roomId}/read-position`, body);
