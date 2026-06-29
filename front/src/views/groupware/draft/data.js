/**
 * 전자결재 더미 데이터 (Draft / Document)
 * 실제 연동 시 services/draft.js 메서드 반환값으로 교체.
 */

// 기안서 종류
export const DRAFT_TYPE_LABEL = {
  GENERAL: '일반',
  LEAVE: '휴가',
  BUSINESS_TRIP: '출장',
  SALES: '매출',
  CANCELLATION: '취소',
};

// 결재 상태
export const APPROVAL_STATUS_META = {
  DRAFTING: { label: '작성중', variant: 'secondary' },
  PENDING: { label: '결재대기', variant: 'warning' },
  IN_PROGRESS: { label: '결재중', variant: 'info' },
  APPROVED: { label: '승인', variant: 'success' },
  REJECTED: { label: '반려', variant: 'danger' },
  WITHDRAWN: { label: '철회', variant: 'dark' },
};

// MY_DOCUMENT_BOX_SUMMARY
export const documentBoxSummary = {
  submitted: 12,
  unsubmitted: 3,
  pendingApproval: 5,
  accessible: 28,
};

// 상신/임시저장/문서함 공통 목록 형태
export const submittedDrafts = [
  { draftId: 1001, type: 'LEAVE', title: '연차 휴가 신청 (6/15~6/16)', drafterName: '김하루', status: 'APPROVED', createdAt: '2026-06-10' },
  { draftId: 1002, type: 'BUSINESS_TRIP', title: '부산 가맹점 출장', drafterName: '김하루', status: 'IN_PROGRESS', createdAt: '2026-06-20' },
  { draftId: 1003, type: 'GENERAL', title: '비품 구매 요청', drafterName: '김하루', status: 'PENDING', createdAt: '2026-06-25' },
  { draftId: 1004, type: 'GENERAL', title: '워크숍 예산 품의', drafterName: '김하루', status: 'REJECTED', createdAt: '2026-06-18' },
];

export const unsubmittedDrafts = [
  { draftId: 2001, type: 'LEAVE', title: '반차 신청 (작성중)', drafterName: '김하루', status: 'DRAFTING', createdAt: '2026-06-28' },
  { draftId: 2002, type: 'GENERAL', title: '교육 참가 신청서 (작성중)', drafterName: '김하루', status: 'DRAFTING', createdAt: '2026-06-27' },
];

// MY_PENDING_APPROVAL_DRAFTS — 내가 결재해야 할 문서
export const pendingApprovalDrafts = [
  { draftId: 3001, type: 'LEAVE', title: '이온유 연차 신청', drafterName: '이온유', status: 'PENDING', createdAt: '2026-06-26' },
  { draftId: 3002, type: 'BUSINESS_TRIP', title: '박서준 대전 출장', drafterName: '박서준', status: 'PENDING', createdAt: '2026-06-27' },
  { draftId: 3003, type: 'GENERAL', title: '최민지 비품 요청', drafterName: '최민지', status: 'PENDING', createdAt: '2026-06-28' },
];
