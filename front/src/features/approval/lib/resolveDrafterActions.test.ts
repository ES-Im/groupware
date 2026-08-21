import { describe, expect, it } from 'vitest'
import type { DraftDetailResponse } from '../model/draftDetail'
import { resolveDrafterActions } from './resolveDrafterActions'

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

const ALL_FALSE = {
  isDrafter: false,
  canSubmit: false,
  canEdit: false,
  canWithdraw: false,
  canCancel: false,
  canDelete: false,
}

describe('resolveDrafterActions', () => {
  it('myEmpId가 undefined이면 isDrafter=false(전 플래그 false)', () => {
    expect(resolveDrafterActions(draft({ approvalStatus: '미상신' }), undefined)).toEqual(ALL_FALSE)
  })

  it('기안자 본인이 아니면(empId 불일치) 전 플래그 false', () => {
    expect(resolveDrafterActions(draft({ drafter: { empId: 10, empName: '기안자' } }), 99)).toEqual(
      ALL_FALSE,
    )
  })

  it('기안자 + UNSUBMITTED("미상신") → 상신·수정·삭제 노출, 철회·취소는 비노출', () => {
    const result = resolveDrafterActions(draft({ approvalStatus: '미상신' }), 10)
    expect(result).toEqual({
      isDrafter: true,
      canSubmit: true,
      canEdit: true,
      canWithdraw: false,
      canCancel: false,
      canDelete: true,
    })
  })

  it('기안자 + WAITING("결재대기") → 상신 철회만 노출', () => {
    const result = resolveDrafterActions(draft({ approvalStatus: '결재대기' }), 10)
    expect(result).toEqual({
      isDrafter: true,
      canSubmit: false,
      canEdit: false,
      canWithdraw: true,
      canCancel: false,
      canDelete: false,
    })
  })

  it('기안자 + IN_PROGRESS("결재진행중") → 상신 철회만 노출', () => {
    const result = resolveDrafterActions(draft({ approvalStatus: '결재진행중' }), 10)
    expect(result).toEqual({
      isDrafter: true,
      canSubmit: false,
      canEdit: false,
      canWithdraw: true,
      canCancel: false,
      canDelete: false,
    })
  })

  it('기안자 + APPROVED("결재완료") + 출장기안 + 취소기안 없음(cancellationDraftId=null) → 취소기안 작성 노출', () => {
    const result = resolveDrafterActions(
      draft({
        approvalStatus: '결재완료',
        cancellationDraftId: null,
        businessTrip: {
          startAt: '2026-07-01T09:00:00',
          endAt: '2026-07-02T18:00:00',
          destination: '부산',
          purpose: '점검',
          participants: [],
        },
      }),
      10,
    )
    expect(result).toEqual({
      isDrafter: true,
      canSubmit: false,
      canEdit: false,
      canWithdraw: false,
      canCancel: true,
      canDelete: false,
    })
  })

  it('기안자 + APPROVED("결재완료") + 연가기안 + 취소기안 없음(cancellationDraftId=null) → 취소기안 작성 노출', () => {
    const result = resolveDrafterActions(
      draft({
        approvalStatus: '결재완료',
        cancellationDraftId: null,
        leave: {
          startAt: '2026-07-01T09:00:00',
          endAt: '2026-07-01T18:00:00',
          leaveType: 'ANNUAL',
          reservedHours: 8,
        },
      }),
      10,
    )
    expect(result.canCancel).toBe(true)
  })

  it('기안자 + APPROVED("결재완료") + 출장기안 + 취소기안 있음(cancellationDraftId non-null) → 취소기안 작성 미노출', () => {
    const result = resolveDrafterActions(
      draft({
        approvalStatus: '결재완료',
        cancellationDraftId: 555,
        businessTrip: {
          startAt: '2026-07-01T09:00:00',
          endAt: '2026-07-02T18:00:00',
          destination: '부산',
          purpose: '점검',
          participants: [],
        },
      }),
      10,
    )
    expect(result.canCancel).toBe(false)
    expect(result.isDrafter).toBe(true)
  })

  it('기안자 + APPROVED("결재완료") + 일반기안(슬롯 전부 null) + 취소기안 없음 → 취소기안 작성 미노출(취소기안 대상 아님)', () => {
    const result = resolveDrafterActions(
      draft({ approvalStatus: '결재완료', cancellationDraftId: null }),
      10,
    )
    expect(result.canCancel).toBe(false)
  })

  it('기안자 + APPROVED("결재완료") + 매출기안 + 취소기안 없음 → 취소기안 작성 미노출(취소기안 대상 아님)', () => {
    const result = resolveDrafterActions(
      draft({
        approvalStatus: '결재완료',
        cancellationDraftId: null,
        sales: { franchiseId: 1, franchiseName: '강남점', reportMonth: '2026-07', salesAmount: 1000000 },
      }),
      10,
    )
    expect(result.canCancel).toBe(false)
  })

  it('기안자 + APPROVED("결재완료") + 취소기안 문서 자기 자신(sourceDraftId 세팅, 나머지 슬롯 null) → 취소기안 작성 미노출(취소기안의 취소기안 방지)', () => {
    const result = resolveDrafterActions(
      draft({ approvalStatus: '결재완료', cancellationDraftId: null, sourceDraftId: 3 }),
      10,
    )
    expect(result.canCancel).toBe(false)
  })

  it('기안자 + REJECTED("반려") → 기안자 액션 없음(삭제 불가)', () => {
    const result = resolveDrafterActions(draft({ approvalStatus: '반려' }), 10)
    expect(result).toEqual({ ...ALL_FALSE, isDrafter: true })
  })

  it('기안자 + 계약 밖 표시명(알 수 없는 상태) → 기안자 액션 없음(default 분기, fail-safe)', () => {
    const result = resolveDrafterActions(draft({ approvalStatus: '알수없음' }), 10)
    expect(result).toEqual({ ...ALL_FALSE, isDrafter: true })
  })
})
