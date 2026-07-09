import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DraftDetailResponse } from '../../model/draftDetail'
import { SalesDraftBody } from './SalesDraftBody'

/**
 * SalesDraftBody(F761, ROADMAP(SALES) T3.2) 컴포넌트 렌더 테스트.
 *
 * 검증 축(SalesDraftBody.tsx 주석 · LeaveDraftBody 동형):
 *   - sales 슬롯(franchiseName·reportMonth·salesAmount) + 공통 content를 렌더.
 *   - 매출액은 천 단위 구분 표기("1,000,000원").
 *   - 보고월은 dayjs 포맷("2026년 7월").
 *   - sales가 null이면(호출부 계약 위반 방어) 아무것도 렌더하지 않는다.
 */

function draft(overrides: Partial<DraftDetailResponse> = {}): DraftDetailResponse {
  return {
    draftId: 1,
    draftType: 'SalesDraft',
    drafter: { empId: 10, empName: '기안자' },
    title: '7월 매출 보고',
    content: '7월 매출을 보고합니다.',
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

describe('SalesDraftBody - sales 슬롯 렌더', () => {
  it('대상 가맹점·매출 보고월·매출액·공통 content를 렌더한다', () => {
    render(
      <SalesDraftBody
        draft={draft({
          sales: {
            franchiseId: 1,
            franchiseName: '강남점',
            reportMonth: '2026-07',
            salesAmount: 1000000,
          },
        })}
      />,
    )

    expect(screen.getByText('강남점')).toBeInTheDocument()
    expect(screen.getByText('2026년 7월')).toBeInTheDocument()
    expect(screen.getByText('1,000,000원')).toBeInTheDocument()
    expect(screen.getByText('7월 매출을 보고합니다.')).toBeInTheDocument()
  })

  it('매출액이 1000 미만이어도 천 단위 구분 규칙이 깨지지 않는다(구분자 없이 그대로)', () => {
    render(
      <SalesDraftBody
        draft={draft({
          sales: {
            franchiseId: 2,
            franchiseName: '역삼점',
            reportMonth: '2026-01',
            salesAmount: 500,
          },
        })}
      />,
    )

    expect(screen.getByText('500원')).toBeInTheDocument()
    expect(screen.getByText('2026년 1월')).toBeInTheDocument()
  })
})

describe('SalesDraftBody - sales가 null이면(방어적 처리)', () => {
  it('아무것도 렌더하지 않는다', () => {
    const { container } = render(<SalesDraftBody draft={draft({ sales: null })} />)

    expect(container).toBeEmptyDOMElement()
  })
})
