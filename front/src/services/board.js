/**
 * BOARD / CATEGORY API (rules/api-endpoint.md > BOARD / MESSAGE / CHAT API)
 */
import {http} from './http/client';
import {buildQuery} from './http/query';

// ── 카테고리 ───────────────────────────────────────────────
export const getCategoriesForManagement = (params) =>
  http.get(`/api/categories/management${buildQuery(params)}`);
export const getCategories = () => http.get('/api/categories');
export const registerCategory = (body) => http.post('/api/categories', body);
export const updateCategoryName = (categoryId, body) =>
  http.patch(`/api/categories/${categoryId}/name`, body);
export const activateCategory = (categoryId) =>
  http.patch(`/api/categories/${categoryId}/visibility/activation`);
export const deactivateCategory = (categoryId) =>
  http.patch(`/api/categories/${categoryId}/visibility/deactivation`);

// ── 게시글 ─────────────────────────────────────────────────
export const registerBoard = (body) => http.post('/api/boards', body);
export const publishBoard = (boardId) => http.patch(`/api/boards/${boardId}/publishment`);
export const updateBoard = (boardId, body) => http.patch(`/api/boards/${boardId}`, body);
export const getBoardsByCategory = (categoryId, params) =>
  http.get(`/api/categories/${categoryId}/boards${buildQuery(params)}`);
export const getLatestBoardsByCategory = (categoryId, limit) =>
  http.get(`/api/categories/${categoryId}/boards/latest${buildQuery({ limit })}`);
export const getBoard = (boardId) => http.get(`/api/boards/${boardId}`);
export const getBoardComments = (boardId, params) =>
  http.get(`/api/boards/${boardId}/comments${buildQuery(params)}`);
export const getBoardFiles = (boardId) => http.get(`/api/boards/${boardId}/files`);
export const getBoardEditMode = (boardId) => http.get(`/api/boards/${boardId}/edit-mode`);
export const getMyBoardDrafts = () => http.get('/api/my/boards/drafts');

// ── 댓글 ───────────────────────────────────────────────────
export const registerComment = (boardId, body) =>
  http.post(`/api/boards/${boardId}/comments`, body);
export const replyComment = (boardId, parentCommentId, body) =>
  http.post(`/api/boards/${boardId}/comments/${parentCommentId}/replies`, body);
export const updateComment = (boardId, commentId, body) =>
  http.patch(`/api/boards/${boardId}/comments/${commentId}`, body);
export const deleteComment = (boardId, commentId) =>
  http.delete(`/api/boards/${boardId}/comments/${commentId}`);
