import { describe, expect, it } from 'vitest'
import type { DraftDetailResponse } from '../model/draftDetail'
import { isSalesDraft } from './isSalesDraft'

/**
 * isSalesDraft(ROADMAP(SALES) T3.1) 슬롯-null 판별 술어 단위 테스트.
 *
 * 판별 규칙(isSalesDraft.ts 주석 · DraftTypeBody 동형):
 *   - sales 슬롯 non-null → 매출 기안(true).
 *   - sales 슬롯 null → false(일반/출장/휴가 등).
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

describe('isSalesDraft', () => {
  it('sales 슬롯 non-null → 매출 기안(true)', () => {
    expect(
      isSalesDraft(
        draft({
          sales: {
            franchiseId: 1,
            franchiseName: '강남점',
            reportMonth: '2026-07',
            salesAmount: 1000000,
          },
        }),
      ),
    ).toBe(true)
  })

  it('sales 슬롯 null → false', () => {
    expect(isSalesDraft(draft())).toBe(false)
  })

  it('draftType 문자열이 "SALES"여도 슬롯이 null이면 false', () => {
    expect(isSalesDraft(draft({ draftType: 'SALES' }))).toBe(false)
  })

  it('leave/businessTrip 슬롯 non-null이어도 sales가 null이면 false', () => {
    expect(
      isSalesDraft(
        draft({
          leave: {
            startAt: '2026-07-01T09:00:00',
            endAt: '2026-07-01T18:00:00',
            leaveType: 'ANNUAL',
            reservedHours: 8,
          },
          businessTrip: {
            startAt: '2026-07-01T09:00:00',
            endAt: '2026-07-02T18:00:00',
            destination: '부산',
            purpose: '점검',
            participants: [],
          },
        }),
      ),
    ).toBe(false)
  })
})
