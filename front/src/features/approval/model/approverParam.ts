/**
 * 결재선 지정 파라미터(`approverId`/`role`/`order`) 공통 타입(ROADMAP(DRAFT) M4).
 *
 * 상신(F702 `DRAFT_SUBMIT`)·취소기안 생성/상신(F704 `DRAFT_CANCELLATION_CREATE(_SUBMISSION)`)의
 * 결재선 재지정 body가 공유하는 항목 계약이다. 필드는 각 스니펫 request-fields.adoc 실측 기준:
 *   - DRAFT_SUBMIT: **최상위가 배열** `[{approverId,role,order}]`(전부 optional, 생략 시 기존 결재선 상신)
 *   - DRAFT_CANCELLATION_CREATE(_SUBMISSION): 객체 안 `approvers?:[{approverId,role,order}]`(optional)
 *
 * role은 서버 enum 이름 문자열(APPROVER/COOPERATOR — ApprovalRole.java). MVP 결재선 선택 UI는
 * 역할 구분 없이 APPROVER로만 지정하므로 string으로 열어둔다(협조 결재자 지정은 범위 밖).
 * order는 결재 순서(1-base). approverId는 결재자 사원 식별 번호(numeric empId).
 */
export interface ApproverParam {
  approverId: number
  role: string
  order: number
}
