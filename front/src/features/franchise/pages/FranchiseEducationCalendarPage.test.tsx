import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { FranchiseEducationCalendarItem } from '../model/franchise'
import { FranchiseEducationCalendarPage } from './FranchiseEducationCalendarPage'

/**
 * FranchiseEducationCalendarPage(F1609, ROADMAP(FRANCHISE) T4.1, P4) 회귀 방지 테스트.
 * UI 개편(2026-07-13, 목업 기준)으로 FullCalendar → **교육 목록 테이블**로 재구성됐다. 데이터원은
 * 여전히 범위 기반 교육 캘린더 조회(FRANCHISE_EDUCATION_CALENDAR)이며, 상태 컬럼은 보유 필드
 * (isActive/isFull/date)에서 파생한다(유형·신청/정원 컬럼은 계약에 데이터가 없어 제거 — 정책 A).
 *
 * 검증 대상:
 * - 조회 데이터가 테이블 행(교육명·교육일·장소·상태 pill)으로 렌더된다.
 * - 파생 상태: 활성+여석 → 접수중, 비활성 → 비활성, 정원 마감 → 정원 마감.
 * - 행 클릭 시 /franchise-educations/:educationId, [교육 등록] → /franchise-educations/new.
 * - 조회 실패 시 handleApiError 토스트.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

function makeItem(
  id: number,
  title: string,
  overrides?: Partial<FranchiseEducationCalendarItem>,
): FranchiseEducationCalendarItem {
  return {
    id,
    // 기본 조회 월(당월) 범위에 들어오도록 오늘 날짜로 고정한다. (상태 파생상 과거일이면 "종료"가
    // 되므로 오늘로 두어 활성/마감/비활성 파생을 그대로 검증한다.)
    date: dayjs().format('YYYY-MM-DD'),
    place: '본사 교육장',
    title,
    isFull: false,
    isActive: true,
    ...overrides,
  }
}

function mockCalendar(items: FranchiseEducationCalendarItem[]) {
  server.use(
    http.get(`${BASE_URL}/api/franchise-educations/calendar`, () => HttpResponse.json(items)),
  )
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FranchiseEducationCalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** 교육명 셀이 든 <tr> 스코프를 좁힌다. */
function rowByTitle(title: string) {
  const row = screen.getByText(title).closest('tr')
  if (!row) {
    throw new Error(`행(${title})을 찾을 수 없습니다`)
  }
  return within(row)
}

describe('FranchiseEducationCalendarPage - 목록 테이블', () => {
  it('교육이 테이블 행(교육명·교육일·장소·상태)으로 렌더된다', async () => {
    mockCalendar([makeItem(1, '위생 교육')])

    renderPage()

    await screen.findByText('위생 교육')
    const row = rowByTitle('위생 교육')
    expect(row.getByText('본사 교육장')).toBeInTheDocument()
    expect(row.getByText(dayjs().format('YYYY-MM-DD'))).toBeInTheDocument()
    expect(row.getByText('접수중')).toBeInTheDocument()
  })

  it('활성이고 정원 여유가 있는 교육은 "접수중"으로 파생된다', async () => {
    mockCalendar([makeItem(2, '신메뉴 교육')])

    renderPage()

    await screen.findByText('신메뉴 교육')
    expect(rowByTitle('신메뉴 교육').getByText('접수중')).toBeInTheDocument()
  })

  it('비활성(isActive=false) 교육은 "비활성"으로 파생된다', async () => {
    mockCalendar([makeItem(3, '비활성 교육', { isActive: false })])

    renderPage()

    await screen.findByText('비활성 교육')
    expect(rowByTitle('비활성 교육').getByText('비활성')).toBeInTheDocument()
  })

  it('정원 마감(isFull=true) 교육은 "정원 마감"으로 파생된다', async () => {
    mockCalendar([makeItem(4, '마감 교육', { isFull: true })])

    renderPage()

    await screen.findByText('마감 교육')
    expect(rowByTitle('마감 교육').getByText('정원 마감')).toBeInTheDocument()
  })
})

describe('FranchiseEducationCalendarPage - 라우팅', () => {
  it('행 클릭 시 /franchise-educations/{educationId}로 이동한다', async () => {
    mockCalendar([makeItem(5, '위생 교육')])
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('위생 교육')
    await user.click(screen.getByText('위생 교육'))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/franchise-educations/5'))
  })

  it('[교육 등록] 버튼 클릭 시 /franchise-educations/new로 이동한다', async () => {
    mockCalendar([])
    const user = userEvent.setup()

    renderPage()

    await user.click(screen.getByRole('button', { name: '교육 등록' }))

    expect(mockNavigate).toHaveBeenCalledWith('/franchise-educations/new')
  })
})

describe('FranchiseEducationCalendarPage - 에러 상태', () => {
  it('조회 실패 시 handleApiError를 통해 에러 토스트가 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류가 발생했습니다' },
          { status: 500 },
        ),
      ),
    )

    renderPage()

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })
})
