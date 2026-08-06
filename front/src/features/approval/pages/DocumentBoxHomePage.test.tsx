import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { DocumentBoxRow, MyDocumentBoxSummary, Page } from '../model/approval'
import { DocumentBoxHomePage } from './DocumentBoxHomePage'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const SUMMARY_URL = `${BASE_URL}/api/document-boxes/me/summary`
const SUBMITTED_URL = `${BASE_URL}/api/document-boxes/me/submitted-drafts`
const PENDING_URL = `${BASE_URL}/api/document-boxes/me/pending-approval-drafts`
const ACCESSIBLE_URL = `${BASE_URL}/api/document-boxes/me/accessible-documents`
const UNSUBMITTED_URL = `${BASE_URL}/api/document-boxes/me/unsubmitted-drafts`

function pageOf(rows: DocumentBoxRow[]): Page<DocumentBoxRow> {
  return {
    content: rows,
    totalElements: rows.length,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: rows.length,
    first: true,
    last: true,
    empty: rows.length === 0,
  }
}

function row(overrides: Partial<DocumentBoxRow> = {}): DocumentBoxRow {
  return {
    draftId: 1,
    drafterName: '홍길동',
    draftTitle: '샘플 문서',
    submittedAt: null,
    latestApproverName: null,
    isFileAttached: false,
    approvalStatus: '미상신',
    ...overrides,
  }
}

const ZERO_SUMMARY: MyDocumentBoxSummary = {
  pendingApprovalDraftCount: 0,
  unsubmittedDraftCount: 0,
  submittedDraftCount: 0,
  accessibleDocumentCount: 0,
}

function mockDistinctLists() {
  server.use(
    http.get(SUBMITTED_URL, () => HttpResponse.json(pageOf([row({ draftTitle: '상신함 문서' })]))),
    http.get(PENDING_URL, () => HttpResponse.json(pageOf([row({ draftTitle: '결재대기 문서' })]))),
    http.get(ACCESSIBLE_URL, () => HttpResponse.json(pageOf([row({ draftTitle: '결재함 문서' })]))),
    http.get(UNSUBMITTED_URL, () => HttpResponse.json(pageOf([row({ draftTitle: '임시저장 문서' })]))),
  )
}

function mockEmptyLists() {
  server.use(
    http.get(SUBMITTED_URL, () => HttpResponse.json(pageOf([]))),
    http.get(PENDING_URL, () => HttpResponse.json(pageOf([]))),
    http.get(ACCESSIBLE_URL, () => HttpResponse.json(pageOf([]))),
    http.get(UNSUBMITTED_URL, () => HttpResponse.json(pageOf([]))),
  )
}

function mockSummary(summary: MyDocumentBoxSummary) {
  server.use(http.get(SUMMARY_URL, () => HttpResponse.json(summary)))
}

function renderPage(initialTab: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/approval/box/${initialTab}`]}>
        <Routes>
          <Route path="/approval/box/:tab" element={<DocumentBoxHomePage />} />
          <Route path="/approval/drafts/new" element={<div>새 기안서 작성 페이지</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DocumentBoxHomePage (F715) - 요약 카드 4종', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('성공 시 4종 카드에 각 건수와 결재대기/임시저장 탭 배지를 렌더한다', async () => {
    mockSummary({
      pendingApprovalDraftCount: 3,
      unsubmittedDraftCount: 2,
      submittedDraftCount: 7,
      accessibleDocumentCount: 10,
    })
    mockEmptyLists()
    renderPage('pending')

    const byCount = (value: string) =>
      screen.findByText((_, el) => el?.textContent === value)
    expect(await byCount('3건')).toBeInTheDocument()
    expect(await byCount('2건')).toBeInTheDocument()
    expect(await byCount('7건')).toBeInTheDocument()
    expect(await byCount('10건')).toBeInTheDocument()

    const pendingTab = screen.getByRole('tab', { name: /결재대기함/ })
    const unsubmittedTab = screen.getByRole('tab', { name: /임시저장함/ })
    expect(pendingTab).toHaveTextContent('3')
    expect(unsubmittedTab).toHaveTextContent('2')
    expect(screen.getByRole('tab', { name: /^상신함$/ })).toHaveTextContent('상신함')
    expect(screen.getByRole('tab', { name: /^결재함$/ })).toHaveTextContent('결재함')
  })

  it('로딩 중이면 4종 카드 모두 건수 대신 스켈레톤을 표시한다', async () => {
    server.use(http.get(SUMMARY_URL, () => new Promise(() => {})))
    mockEmptyLists()
    const { container } = renderPage('pending')

    expect(await screen.findByText('결재 대기')).toBeInTheDocument()
    expect(
      screen.queryByText((_, el) => /^\d+건$/.test(el?.textContent ?? '')),
    ).not.toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4)
  })

  it('조회 실패 시 카드는 "-"로 대체되고 에러 토스트를 띄운다', async () => {
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json(null, { status: 500 })))
    mockEmptyLists()
    renderPage('pending')

    const cards = await screen.findAllByText('-')
    expect(cards.length).toBeGreaterThanOrEqual(4)

    const { toast } = await import('sonner')
    expect(toast.error).toHaveBeenCalledWith('요청 처리 중 오류가 발생했습니다')
  })
})

describe('DocumentBoxHomePage (F715) - URL :tab 파라미터', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('유효한 tab 값(accessible)으로 진입하면 해당 문서함 목록 훅만 렌더된다', async () => {
    mockSummary(ZERO_SUMMARY)
    mockDistinctLists()
    renderPage('accessible')

    expect(await screen.findByText('결재함 문서')).toBeInTheDocument()
    expect(screen.queryByText('상신함 문서')).not.toBeInTheDocument()
    expect(screen.queryByText('결재대기 문서')).not.toBeInTheDocument()
    expect(screen.queryByText('임시저장 문서')).not.toBeInTheDocument()
  })

  it('유효하지 않은 tab 값으로 진입하면 결재대기함(pending)으로 정규화된다', async () => {
    mockSummary(ZERO_SUMMARY)
    mockDistinctLists()
    renderPage('not-a-real-tab')

    expect(await screen.findByText('결재대기 문서')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /결재대기함/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})

describe('DocumentBoxHomePage (F715) - 탭/카드/헤더 네비게이션', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('탭 클릭 시 해당 탭 목록으로 전환된다', async () => {
    mockSummary(ZERO_SUMMARY)
    mockDistinctLists()
    const user = userEvent.setup()
    renderPage('pending')

    expect(await screen.findByText('결재대기 문서')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /^상신함$/ }))

    expect(await screen.findByText('상신함 문서')).toBeInTheDocument()
    expect(screen.queryByText('결재대기 문서')).not.toBeInTheDocument()
  })

  it('요약 카드 클릭 시 해당 탭으로 전환된다', async () => {
    mockSummary(ZERO_SUMMARY)
    mockDistinctLists()
    const user = userEvent.setup()
    renderPage('pending')

    expect(await screen.findByText('결재대기 문서')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /상신 문서/ }))

    expect(await screen.findByText('상신함 문서')).toBeInTheDocument()
    expect(screen.queryByText('결재대기 문서')).not.toBeInTheDocument()
  })

  it('"새 기안서 작성" 버튼 클릭 시 /approval/drafts/new로 이동한다', async () => {
    mockSummary(ZERO_SUMMARY)
    mockEmptyLists()
    const user = userEvent.setup()
    renderPage('pending')

    await user.click(screen.getByRole('button', { name: /새 기안서 작성/ }))

    expect(await screen.findByText('새 기안서 작성 페이지')).toBeInTheDocument()
  })
})
