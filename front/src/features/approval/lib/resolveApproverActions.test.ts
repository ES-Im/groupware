import { describe, expect, it } from 'vitest'
import type { DraftApprover, DraftDetailResponse } from '../model/draftDetail'
import { resolveApproverActions } from './resolveApproverActions'

function draft(overrides: Partial<DraftDetailResponse> = {}): DraftDetailResponse {
  return {
    draftId: 1,
    draftType: 'GENERAL',
    drafter: { empId: 10, empName: '기안자' },
    title: '제목',
    content: '내용',
    submittedAt: null,
    approvalStatus: '미상신',
    files: [],
    approvers: [],
    circulations: [],
    sourceDraftId: null,
    cancellationDraftId: null,
    cancellationSubmittedAt: null,
    leave: null,
    businessTrip: null,
    sales: null,
    ...overrides,
  }
}

function approver(overrides: Partial<DraftApprover> = {}): DraftApprover {
  return {
    empId: 10,
    empName: '결재자',
    role: 'APPROVER',
    order: 1,
    approvedAt: null,
    rejectedAt: null,
    rejectReason: null,
    ...overrides,
  }
}

const NONE = { canApprove: false, canReject: false }
const ALL = { canApprove: true, canReject: true }

describe('resolveApproverActions', () => {
  it('UNSUBMITTED(미상신) + 본인이 결재선 order 1 → 비노출(임시저장 본인전결 버그 재현 케이스)', () => {
    const result = resolveApproverActions(
      draft({ approvalStatus: '미상신', approvers: [approver({ empId: 10, order: 1 })] }),
      10,
    )
    expect(result).toEqual(NONE)
  })

  it('WAITING(결재대기) + 본인 차례(order 최소, 미처리) → 승인/반려 노출', () => {
    const result = resolveApproverActions(
      draft({ approvalStatus: '결재대기', approvers: [approver({ empId: 10, order: 1 })] }),
      10,
    )
    expect(result).toEqual(ALL)
  })

  it('WAITING이지만 본인 차례가 아님(다른 사람이 order 최소) → 비노출', () => {
    const result = resolveApproverActions(
      draft({
        approvalStatus: '결재대기',
        approvers: [approver({ empId: 20, order: 1 }), approver({ empId: 10, order: 2 })],
      }),
      10,
    )
    expect(result).toEqual(NONE)
  })

  it('IN_PROGRESS(결재진행중) + 본인 차례 → 승인/반려 노출', () => {
    const result = resolveApproverActions(
      draft({
        approvalStatus: '결재진행중',
        approvers: [
          approver({ empId: 20, order: 1, approvedAt: '2026-08-01T09:00:00' }),
          approver({ empId: 10, order: 2 }),
        ],
      }),
      10,
    )
    expect(result).toEqual(ALL)
  })

  it('APPROVED(결재완료) → 비노출', () => {
    const result = resolveApproverActions(
      draft({
        approvalStatus: '결재완료',
        approvers: [approver({ empId: 10, order: 1, approvedAt: '2026-08-01T09:00:00' })],
      }),
      10,
    )
    expect(result).toEqual(NONE)
  })

  it('REJECTED(반려) → 비노출', () => {
    const result = resolveApproverActions(
      draft({
        approvalStatus: '반려',
        approvers: [approver({ empId: 10, order: 1, rejectedAt: '2026-08-01T09:00:00' })],
      }),
      10,
    )
    expect(result).toEqual(NONE)
  })

  it('myEmpId가 undefined이면 비노출', () => {
    const result = resolveApproverActions(
      draft({ approvalStatus: '결재대기', approvers: [approver({ empId: 10, order: 1 })] }),
      undefined,
    )
    expect(result).toEqual(NONE)
  })
})
