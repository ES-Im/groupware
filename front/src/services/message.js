/**
 * MESSAGE API (rules/api-endpoint.md > BOARD / MESSAGE / CHAT API)
 */
import {http} from './http/client';

// ── 작성/발송 ──────────────────────────────────────────────
export const createDraftMessage = (body) => http.post('/api/messages/drafts', body);
export const sendMessage = (body) => http.post('/api/messages', body);
export const sendDraftMessage = (messageId) =>
  http.patch(`/api/messages/drafts/${messageId}/send`);
export const deleteDraftMessage = (messageId) =>
  http.delete(`/api/messages/drafts/${messageId}`);
export const updateDraftMessage = (messageId, body) =>
  http.patch(`/api/messages/drafts/${messageId}`, body);
export const updateDraftMessageReceivers = (messageId, body) =>
  http.patch(`/api/messages/drafts/${messageId}/receivers`, body);

// ── 보낸 쪽지 ──────────────────────────────────────────────
export const trashSentMessage = (messageId) =>
  http.patch(`/api/messages/sent/${messageId}/trash`);
export const restoreSentMessage = (messageId) =>
  http.patch(`/api/messages/sent/${messageId}/trash/restoration`);
export const deleteSentMessage = (messageId) =>
  http.patch(`/api/messages/sent/${messageId}/deletion`);

// ── 받은 쪽지 ──────────────────────────────────────────────
export const readReceivedMessage = (messageId) =>
  http.patch(`/api/messages/received/${messageId}/read`);
export const trashReceivedMessage = (messageId) =>
  http.patch(`/api/messages/received/${messageId}/trash`);
export const restoreReceivedMessage = (messageId) =>
  http.patch(`/api/messages/received/${messageId}/trash/restoration`);
export const deleteReceivedMessage = (messageId) =>
  http.patch(`/api/messages/received/${messageId}/deletion`);
