/**
 * FRANCHISE API (rules/api-endpoint.md > FRANCHISE API)
 */
import {http} from './http/client';
import {buildQuery} from './http/query';

// ── 가맹점 ─────────────────────────────────────────────────
export const getFranchises = (params) => http.get(`/api/franchises${buildQuery(params)}`);
export const getFranchise = (franchiseId) => http.get(`/api/franchises/${franchiseId}`);
export const createFranchise = (body) => http.post('/api/franchises', body);
export const updateFranchise = (franchiseId, body) =>
  http.patch(`/api/franchises/${franchiseId}`, body);
export const updateFranchiseStatus = (franchiseId, status) =>
  http.patch(`/api/franchises/${franchiseId}/status${buildQuery({ status })}`);
export const updateFranchiseManager = (franchiseId, newManagerId) =>
  http.patch(`/api/franchises/${franchiseId}/managers${buildQuery({ newManagerId })}`);
export const updateFranchiseMemo = (franchiseId, body) =>
  http.patch(`/api/franchises/${franchiseId}/memo`, body);
export const clearFranchiseMemo = (franchiseId) =>
  http.patch(`/api/franchises/${franchiseId}/clear-memo`);

// ── 교육 ───────────────────────────────────────────────────
export const getEducationCalendar = (params) =>
  http.get(`/api/franchise-educations/calendar${buildQuery(params)}`);
export const getEducation = (educationId) =>
  http.get(`/api/franchise-educations/${educationId}`);
export const getEducationApplicants = (educationId) =>
  http.get(`/api/franchise-educations/${educationId}/applicants`);
export const createEducation = (body) => http.post('/api/franchise-educations', body);
export const updateEducation = (educationId, body) =>
  http.patch(`/api/franchise-educations/${educationId}`, body);
export const activateEducation = (educationId) =>
  http.post(`/api/franchise-educations/${educationId}/activation`);
export const deactivateEducation = (educationId) =>
  http.post(`/api/franchise-educations/${educationId}/deactivation`);

// ── 문의/답변 ──────────────────────────────────────────────
export const getInquiries = (params) =>
  http.get(`/api/franchise-inquiries${buildQuery(params)}`);
export const getInquiry = (inquiryId) =>
  http.get(`/api/franchise-inquiries/${inquiryId}`);
export const getInquiryAnswer = (inquiryId) =>
  http.get(`/api/franchise-inquiries/${inquiryId}/answer`);
export const assignInquiryAnswer = (inquiryId, assignedEmpId) =>
  http.patch(
    `/api/franchise-inquiries/${inquiryId}/assign-answer${buildQuery({ assignedEmpId })}`
  );
export const createInquiryAnswer = (inquiryId, body) =>
  http.post(`/api/franchise-inquiries/${inquiryId}/answers`, body);
export const updateInquiryAnswer = (inquiryId, body) =>
  http.patch(`/api/franchise-inquiries/${inquiryId}/answers`, body);
export const sendInquiryAnswer = (inquiryId) =>
  http.patch(`/api/franchise-inquiries/${inquiryId}/answers/send`);

// ── 매출 ───────────────────────────────────────────────────
export const getYearlySales = (franchiseId, year) =>
  http.get(`/api/franchises/${franchiseId}/sales/years/${year}`);
export const getMonthlySales = (franchiseId, yearMonth) =>
  http.get(`/api/franchises/${franchiseId}/sales/months/${yearMonth}`);
export const getDailySales = (franchiseId, date) =>
  http.get(`/api/franchises/${franchiseId}/sales/dates/${date}`);
