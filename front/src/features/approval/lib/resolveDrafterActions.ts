import type { DraftDetailResponse } from '../model/draftDetail'
import { resolveApprovalStatus } from './approvalStatusBadge'

/**
 * 기안자 액션 버튼 노출 판정 결과(ROADMAP(DRAFT) T4.1). 상세 응답에서 파생하는 순수 값이다.
 * 각 플래그는 "이 버튼을 노출해도 되는가"의 프론트 도출값이며, 최종 판단은 서버가 한다
 * (PRD §접근 권한 Open Q#4 — 프론트는 노출만 담당, 규칙 위반 시 서버 403/도메인 에러로 폴백).
 */
export interface DrafterActionAvailability {
  /** 기안자 본인 여부(모든 기안자 액션의 전제). */
  isDrafter: boolean
  /** 상신(F702) — 기안자 + UNSUBMITTED. */
  canSubmit: boolean
  /** 수정(유형별 작성 PRD) — 기안자 + UNSUBMITTED. 이번 공통 범위는 미구현 폴백(Open Q#3). */
  canEdit: boolean
  /** 상신 철회(F703) — 기안자 + WAITING·IN_PROGRESS. */
  canWithdraw: boolean
  /** 취소 기안 작성(F704) — 기안자 + APPROVED + 아직 취소기안이 없음(cancellationDraftId==null). */
  canCancel: boolean
}

const NONE: DrafterActionAvailability = {
  isDrafter: false,
  canSubmit: false,
  canEdit: false,
  canWithdraw: false,
  canCancel: false,
}

/**
 * 기안서 상세 응답 + 본인 empId로 기안자 액션 버튼 노출 집합을 도출한다(순수 함수, T4.1).
 *
 * 판정 규칙(PRD §기안서 상세 페이지 기안자 액션):
 *   - 기안자 본인(`draft.drafter.empId === myEmpId`)이 아니면 전부 비노출.
 *   - UNSUBMITTED(미상신)      → [상신] + [수정]
 *   - WAITING·IN_PROGRESS(진행) → [상신 철회]
 *   - APPROVED(완료) + 취소기안 없음 → [취소 기안 작성]
 *   - REJECTED/그 외/계약 밖 표시명 → 기안자 액션 없음
 *
 * `approvalStatus`는 표시명 문자열(예 "결재진행중")로 내려오므로 resolveApprovalStatus로 코드
 * 변환해 판정한다(계약 밖 표시명은 undefined → default 분기로 안전하게 비노출).
 *
 * myEmpId 소스: me 응답의 numeric 사원 PK(`useMeQuery().data.empBasicInfo.empId`, model/me.ts에
 * 보강). 이 함수는 그 값을 인자로 받는 순수 함수라 소스에 결합되지 않는다 — me 로딩 전/실패로
 * undefined가 들어오면 isDrafter=false로 안전하게 아무 버튼도 노출하지 않는다(fail-closed).
 */
export function resolveDrafterActions(
  draft: DraftDetailResponse,
  myEmpId: number | undefined,
): DrafterActionAvailability {
  const isDrafter = myEmpId !== undefined && draft.drafter.empId === myEmpId
  if (!isDrafter) {
    return NONE
  }

  const base = { ...NONE, isDrafter: true }
  switch (resolveApprovalStatus(draft.approvalStatus)) {
    case 'UNSUBMITTED':
      return { ...base, canSubmit: true, canEdit: true }
    case 'WAITING':
    case 'IN_PROGRESS':
      return { ...base, canWithdraw: true }
    case 'APPROVED':
      return { ...base, canCancel: draft.cancellationDraftId == null }
    default:
      // REJECTED(반려) 또는 계약 밖 표시명 — 기안자가 취할 수 있는 액션 없음.
      return base
  }
}
