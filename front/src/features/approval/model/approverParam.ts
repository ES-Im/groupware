/**
 * 결재선 지정 파라미터(`approverId`/`role`/`order`) 공통 타입(ROADMAP(DRAFT) M4).
 *
 * 상신(F702 `DRAFT_SUBMIT`)·취소기안 생성/상신(F704 `DRAFT_CANCELLATION_CREATE(_SUBMISSION)`)의
 * 결재선 재지정 body가 공유하는 항목 계약이다. 필드는 각 스니펫 request-fields.adoc 실측 기준:
 *   - DRAFT_SUBMIT: **최상위가 배열** `[{approverId,role,order}]`(전부 optional, 생략 시 기존 결재선 상신)
 *   - DRAFT_CANCELLATION_CREATE(_SUBMISSION): 객체 안 `approvers?:[{approverId,role,order}]`(optional)
 *
 * role은 서버 enum 이름 문자열(ApprovalRole.java 실측 — APPROVER/COOPERATOR 2종뿐이라 유니온으로
 * 조인다). order는 결재 순서(1-base). approverId는 결재자 사원 식별 번호(numeric empId).
 */

/** 결재선 역할(ApprovalRole.java 실측): APPROVER=결재자, COOPERATOR=협조 승인자. */
export type ApprovalRole = 'APPROVER' | 'COOPERATOR'

/**
 * 결재선 역할 select 옵션(작성 화면 행별 역할 지정 — 라벨은 상세 표기용
 * `getApprovalRoleLabel`과 동일 어휘를 유지한다). 첫 옵션이 기본값(결재).
 */
export const APPROVAL_ROLE_OPTIONS: { value: ApprovalRole; label: string }[] = [
  { value: 'APPROVER', label: '결재' },
  { value: 'COOPERATOR', label: '협조' },
]

/**
 * 서버 응답·select 값 등 string 경계의 role을 ApprovalRole로 정규화한다.
 * 계약 밖 값은 APPROVER로 폴백한다(발명 금지 — 최종 판정은 서버).
 */
export function toApprovalRole(role: string): ApprovalRole {
  return role === 'COOPERATOR' ? 'COOPERATOR' : 'APPROVER'
}

export interface ApproverParam {
  approverId: number
  role: ApprovalRole
  order: number
}
