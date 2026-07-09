import { describe, expect, it } from 'vitest'
import type { DraftDetailResponse } from '../model/draftDetail'
import { isLeaveDraft } from './isLeaveDraft'

/**
 * isLeaveDraft(ROADMAP(LEAVE) T2.1) 슬롯-null 판별 술어 단위 테스트.
 *
 * 판별 규칙(isLeaveDraft.ts 주석 · DraftTypeBody 동형):
 *   - leave 슬롯 non-null → 휴가 기안(true).
 *   - leave 슬롯 null → false(일반/출장/매출 등).
 * draftType 문자열은 판별에 쓰지 않는다(실측 outdated).
 */

function draft(overrides: Partial<DraftDetailResponse> = {}): DraftDetailResponse {
  return {
    draftId: 1,
    draftType: 'GeneralDraft',
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

describe('isLeaveDraft', () => {
  it('leave 슬롯 non-null → 휴가 기안(true)', () => {
    expect(
      isLeaveDraft(
        draft({
          leave: {
            startAt: '2026-07-01T09:00:00',
            endAt: '2026-07-01T18:00:00',
            leaveType: 'ANNUAL',
            reservedHours: 8,
          },
        }),
      ),
    ).toBe(true)
  })

  it('leave 슬롯 null → false', () => {
    expect(isLeaveDraft(draft())).toBe(false)
  })

  it('draftType 문자열이 "LEAVE"여도 슬롯이 null이면 false', () => {
    expect(isLeaveDraft(draft({ draftType: 'LEAVE' }))).toBe(false)
  })

  it('businessTrip/sales 슬롯 non-null이어도 leave가 null이면 false', () => {
    expect(
      isLeaveDraft(
        draft({
          businessTrip: {
            startAt: '2026-07-01T09:00:00',
            endAt: '2026-07-02T18:00:00',
            destination: '부산',
            purpose: '점검',
            participants: [],
          },
          sales: {},
        }),
      ),
    ).toBe(false)
  })
})
