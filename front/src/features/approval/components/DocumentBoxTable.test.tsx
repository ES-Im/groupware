import type { UseQueryResult } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DocumentBoxRow, Page } from '../model/approval'
import { DocumentBoxTable } from './DocumentBoxTable'

/**
 * DocumentBoxTable(ROADMAP(DRAFT) T1.4, F710·F712·F713·F714) 공용 목록 컴포넌트 테스트.
 *
 * 이 컴포넌트는 목록 조회 훅을 prop(useListQuery)으로 주입받으므로, 네트워크/react-query를 태우지
 * 않고 조회 상태(로딩/에러/데이터/빈목록)를 고정한 스텁 훅을 주입해 렌더 분기를 격리 검증한다.
 * - 컬럼 렌더(제목/기안자/상신일시/최근 결재자/상태 배지/첨부)와 null 대시 표기.
 * - 빈 목록 안내 문구.
 * - onRowClick 주입 시 행이 role="button"으로 인터랙티브해지고 클릭 시 draftId로 콜백된다.
 * - onRowClick 미주입 시 행이 비인터랙티브(role=button 없음)로 렌더된다.
 */

function makeRow(overrides: Partial<DocumentBoxRow> = {}): DocumentBoxRow {
  return {
    draftId: 1,
    drafterName: '홍길동',
    draftTitle: '연차 신청서',
    submittedAt: '2026-07-01T14:30:00',
    latestApproverName: '김결재',
    isFileAttached: true,
    approvalStatus: '결재완료',
    ...overrides,
  }
}

function makePage(content: DocumentBoxRow[]): Page<DocumentBoxRow> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: content.length,
    first: true,
    last: true,
    empty: content.length === 0,
  }
}

/** 조회 상태를 고정한 스텁 훅 생성기. 컴포넌트는 data/error/isLoading만 소비한다. */
function stubHook(state: {
  data?: Page<DocumentBoxRow>
  error?: unknown
  isLoading?: boolean
}) {
  return (() =>
    ({
      data: state.data,
      error: state.error ?? null,
      isLoading: state.isLoading ?? false,
    }) as unknown as UseQueryResult<Page<DocumentBoxRow>>) as never
}

describe('DocumentBoxTable (F710·F712·F713·F714)', () => {
  it('제목/기안자/상신일시/최근 결재자/상태 배지/첨부 컬럼을 한 행에 렌더한다', () => {
    render(<DocumentBoxTable useListQuery={stubHook({ data: makePage([makeRow()]) })} />)

    // 헤더
    expect(screen.getByText('제목')).toBeInTheDocument()
    expect(screen.getByText('기안자')).toBeInTheDocument()
    expect(screen.getByText('상신일시')).toBeInTheDocument()
    expect(screen.getByText('최근 결재자')).toBeInTheDocument()
    expect(screen.getByText('상태')).toBeInTheDocument()
    expect(screen.getByText('첨부')).toBeInTheDocument()

    // 본문
    expect(screen.getByText('연차 신청서')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    // submittedAt은 formatDraftDateTime으로 "YYYY-MM-DD HH:mm" 포맷된다.
    expect(screen.getByText('2026-07-01 14:30')).toBeInTheDocument()
    expect(screen.getByText('김결재')).toBeInTheDocument()
    expect(screen.getByText('결재완료')).toBeInTheDocument()
    // 첨부 있음 → Paperclip 아이콘(aria-label)
    expect(screen.getByLabelText('첨부파일 있음')).toBeInTheDocument()
  })

  it('submittedAt/latestApproverName이 null이면 대시("-")로 표기한다', () => {
    render(
      <DocumentBoxTable
        useListQuery={stubHook({
          data: makePage([makeRow({ submittedAt: null, latestApproverName: null })]),
        })}
      />,
    )

    // submittedAt null → "-", latestApproverName null → "-" (2개)
    expect(screen.getAllByText('-')).toHaveLength(2)
  })

  it('첨부가 없으면(isFileAttached=false) "첨부파일 없음" 라벨로 대시 표기한다', () => {
    render(
      <DocumentBoxTable
        useListQuery={stubHook({ data: makePage([makeRow({ isFileAttached: false })]) })}
      />,
    )

    expect(screen.getByLabelText('첨부파일 없음')).toBeInTheDocument()
    expect(screen.queryByLabelText('첨부파일 있음')).not.toBeInTheDocument()
  })

  it('목록이 비면 emptyMessage를 노출하고 표(table)는 렌더하지 않는다', () => {
    render(
      <DocumentBoxTable
        useListQuery={stubHook({ data: makePage([]) })}
        emptyMessage="상신한 문서가 없습니다."
      />,
    )

    expect(screen.getByText('상신한 문서가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('로딩 중이면 "불러오는 중..."을 노출한다', () => {
    render(<DocumentBoxTable useListQuery={stubHook({ isLoading: true })} />)

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('조회 에러 시 "목록을 불러오지 못했습니다." 문구를 노출한다', () => {
    render(<DocumentBoxTable useListQuery={stubHook({ error: new Error('boom') })} />)

    expect(screen.getByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
  })

  it('onRowClick 주입 시 행이 role="button"으로 인터랙티브해지고 클릭 시 draftId로 콜백된다', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(
      <DocumentBoxTable
        useListQuery={stubHook({ data: makePage([makeRow({ draftId: 42 })]) })}
        onRowClick={onRowClick}
      />,
    )

    // 페이지네이션 버튼과 구분하기 위해 행의 접근성 이름(셀 텍스트 결합)으로 특정한다.
    const row = screen.getByRole('button', { name: /연차 신청서/ })
    await user.click(row)

    expect(onRowClick).toHaveBeenCalledWith(42)
  })

  it('onRowClick 미주입 시 행은 비인터랙티브(role=button 아님)로 렌더된다', () => {
    render(<DocumentBoxTable useListQuery={stubHook({ data: makePage([makeRow()]) })} />)

    // 행이 button role을 갖지 않으므로 title로 button을 조회하면 없다(페이지네이션 버튼은 별개).
    expect(screen.queryByRole('button', { name: /연차 신청서/ })).not.toBeInTheDocument()
    // 대신 tr은 암묵적 row role로 렌더된다(헤더행 + 데이터행).
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })
})
