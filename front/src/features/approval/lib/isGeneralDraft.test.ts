import { describe, expect, it } from 'vitest'
import type { DraftDetailResponse } from '../model/draftDetail'
import { isGeneralDraft } from './isGeneralDraft'

/**
 * isGeneralDraft(ROADMAP(DRAFT-COMMON) T2.1, Major M1) 슬롯-null 판별 술어 단위 테스트.
 *
 * 판별 규칙(isGeneralDraft.ts 주석 · DraftTypeBody 동형):
 *   - leave/businessTrip/sales 전부 null + sourceDraftId null → 순수 일반 기안(true).
 *   - 유형 슬롯 중 하나라도 non-null(휴가/출장/매출) → false.
 *   - sourceDraftId non-null(취소기안) → false.
 * draftType 문자열은 판별에 쓰지 않는다(실측 "GeneralDraft"·스니펫 outdated).
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

describe('isGeneralDraft', () => {
  it('유형 슬롯 전부 null + sourceDraftId null → 일반 기안(true)', () => {
    expect(isGeneralDraft(draft())).toBe(true)
  })

  it('draftType 문자열과 무관하게 슬롯이 전부 null이면 true', () => {
    expect(isGeneralDraft(draft({ draftType: 'BUSINESS_TRIP' }))).toBe(true)
  })

  it('leave 슬롯 non-null(휴가) → false', () => {
    expect(
      isGeneralDraft(
        draft({
          leave: {
            startAt: '2026-07-01T09:00:00',
            endAt: '2026-07-01T18:00:00',
            leaveType: 'ANNUAL',
            reservedHours: 8,
          },
        }),
      ),
    ).toBe(false)
  })

  it('businessTrip 슬롯 non-null(출장) → false', () => {
    expect(
      isGeneralDraft(
        draft({
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

  it('sales 슬롯 non-null(매출) → false', () => {
    expect(
      isGeneralDraft(
        draft({
          sales: { franchiseId: 1, franchiseName: '강남점', reportMonth: '2026-07', salesAmount: 1000000 },
        }),
      ),
    ).toBe(false)
  })

  it('sourceDraftId non-null(취소기안) → false', () => {
    expect(isGeneralDraft(draft({ sourceDraftId: 5 }))).toBe(false)
  })
})
