import { describe, expect, it } from 'vitest'
import type { DraftDetailResponse } from '../model/draftDetail'
import { isBusinessTripDraft } from './isBusinessTripDraft'

/**
 * isBusinessTripDraft(ROADMAP(DRAFT-BUSINESSTRIP) T2.1) 슬롯-null 판별 술어 단위 테스트.
 *
 * 판별 규칙(isBusinessTripDraft.ts 주석 · DraftTypeBody 동형):
 *   - businessTrip 슬롯 non-null → 출장 기안(true).
 *   - businessTrip 슬롯 null → false(일반/휴가/매출 등).
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

describe('isBusinessTripDraft', () => {
  it('businessTrip 슬롯 non-null → 출장 기안(true)', () => {
    expect(
      isBusinessTripDraft(
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
    ).toBe(true)
  })

  it('businessTrip 슬롯 null → false', () => {
    expect(isBusinessTripDraft(draft())).toBe(false)
  })

  it('draftType 문자열이 "BUSINESS_TRIP"이어도 슬롯이 null이면 false', () => {
    expect(isBusinessTripDraft(draft({ draftType: 'BUSINESS_TRIP' }))).toBe(false)
  })

  it('leave/sales 슬롯 non-null이어도 businessTrip이 null이면 false', () => {
    expect(isBusinessTripDraft(draft({ leave: {}, sales: {} }))).toBe(false)
  })
})
