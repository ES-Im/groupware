/**
 * DRAFT / DOCUMENT API (rules/api-endpoint.md > DRAFT / DOCUMENT API)
 */
import {http} from './http/client';
import {buildQuery} from './http/query';

// ── 휴가/출장 신청 이력 ────────────────────────────────────
/** MY_LEAVE_REQUEST_HISTORY */
export const getMyLeaveHistory = (params) =>
  http.get(`/api/leaves/employees/me/request-history${buildQuery(params)}`);

/** DEPT_LEAVE_REQUEST_HISTORY */
export const getDeptLeaveHistory = (deptId, params) =>
  http.get(`/api/leaves/departments/${deptId}/request-history${buildQuery(params)}`);

/** MY_BUSINESS_TRIP_REQUEST_HISTORY */
export const getMyBusinessTripHistory = (params) =>
  http.get(`/api/business-trips/employees/me/request-history${buildQuery(params)}`);

/** DEPT_BUSINESS_TRIP_REQUEST_HISTORY */
export const getDeptBusinessTripHistory = (deptId, params) =>
  http.get(`/api/business-trips/departments/${deptId}/request-history${buildQuery(params)}`);

// ── 기안서 상세/생성 ───────────────────────────────────────
/** DRAFT_DETAIL */
export const getDraft = (draftId) => http.get(`/api/drafts/${draftId}`);

/** GENERAL_DRAFT_CREATE / *_SUBMISSION */
export const createGeneralDraft = (body) => http.post('/api/drafts/generals', body);
export const createAndSubmitGeneralDraft = (body) =>
  http.post('/api/drafts/generals/submission', body);

/** LEAVE_DRAFT_CREATE / *_SUBMISSION */
export const createLeaveDraft = (body) => http.post('/api/drafts/leaves', body);
export const createAndSubmitLeaveDraft = (body) =>
  http.post('/api/drafts/leaves/submission', body);

/** BUSINESS_TRIP_DRAFT_CREATE / *_SUBMISSION */
export const createBusinessTripDraft = (body) => http.post('/api/drafts/business-trips', body);
export const createAndSubmitBusinessTripDraft = (body) =>
  http.post('/api/drafts/business-trips/submission', body);

/** SALES_DRAFT_CREATE / *_SUBMISSION (FRANCHISE) */
export const createSalesDraft = (body) => http.post('/api/drafts/sales', body);
export const createAndSubmitSalesDraft = (body) =>
  http.post('/api/drafts/sales/submission', body);

// ── 기안서 수정 ────────────────────────────────────────────
export const updateGeneralDraft = (draftId, body) =>
  http.patch(`/api/drafts/generals/${draftId}`, body);
export const updateLeaveDraft = (draftId, body) =>
  http.patch(`/api/drafts/leaves/${draftId}`, body);
export const updateBusinessTripDraft = (draftId, body) =>
  http.patch(`/api/drafts/business-trips/${draftId}`, body);
export const updateSalesDraft = (draftId, body) =>
  http.patch(`/api/drafts/sales/${draftId}`, body);
/** BUSINESS_TRIP_PARTICIPANTS_UPDATE */
export const updateBusinessTripParticipants = (draftId, body) =>
  http.patch(`/api/drafts/business-trips/${draftId}/participants`, body);

// ── 상신/결재 흐름 ─────────────────────────────────────────
/** DRAFT_SUBMIT */
export const submitDraft = (draftId, body) =>
  http.patch(`/api/drafts/${draftId}/submission`, body);
/** DRAFT_SUBMISSION_WITHDRAWAL */
export const withdrawDraft = (draftId) =>
  http.patch(`/api/drafts/${draftId}/submission-withdrawal`);
/** DRAFT_CANCELLATION_CREATE / *_SUBMISSION */
export const createCancellationDraft = (sourceDraftId, body) =>
  http.post(`/api/drafts/${sourceDraftId}/cancellation-drafts`, body);
export const createAndSubmitCancellationDraft = (sourceDraftId, body) =>
  http.post(`/api/drafts/${sourceDraftId}/cancellation-drafts/submission`, body);
/** DRAFT_APPROVE / DRAFT_REJECT */
export const approveDraft = (draftId) => http.patch(`/api/drafts/${draftId}/approval`);
export const rejectDraft = (draftId, body) =>
  http.patch(`/api/drafts/${draftId}/rejection`, body);

// ── 공람 ───────────────────────────────────────────────────
export const addCirculation = (draftId, body) =>
  http.post(`/api/drafts/${draftId}/circulations`, body);
export const removeCirculation = (draftId, empId) =>
  http.delete(`/api/drafts/${draftId}/circulations/${empId}`);
export const readCirculation = (draftId) =>
  http.patch(`/api/drafts/${draftId}/circulations/me/read`);

// ── 문서함 ─────────────────────────────────────────────────
export const getMySubmittedDrafts = (params) =>
  http.get(`/api/document-boxes/me/submitted-drafts${buildQuery(params)}`);
export const getMyUnsubmittedDrafts = (params) =>
  http.get(`/api/document-boxes/me/unsubmitted-drafts${buildQuery(params)}`);
export const getMyPendingApprovalDrafts = (params) =>
  http.get(`/api/document-boxes/me/pending-approval-drafts${buildQuery(params)}`);
export const getMyPendingApprovalDraftsCount = () =>
  http.get('/api/document-boxes/me/pending-approval-drafts/count');
export const getMyDocumentBoxSummary = () => http.get('/api/document-boxes/me/summary');
export const getMyAccessibleDocuments = (params) =>
  http.get(`/api/document-boxes/me/accessible-documents${buildQuery(params)}`);
