import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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
 * MyMeetingCalendarPage.test.tsx의 패턴(MSW server.use + QueryClient + MemoryRouter,
 * FullCalendar 실제 렌더)을 복제한다.
 *
 * 검증 대상:
 * - 조회 데이터가 `제목 · 장소` 형식 이벤트로 캘린더에 렌더된다.
 * - 비활성(isActive=false)/정원 마감(isFull=true) 교육은 opacity-50 클래스로 시각 구분되고,
 *   활성+여석 교육에는 붙지 않는다.
 * - 이벤트 클릭 시 /franchise-educations/:educationId로 navigate.
 * - 조회 실패 시 handleApiError를 통한 에러 토스트.
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
    // FullCalendar 초기 뷰(dayGridMonth)가 현재월(테스트 실행 시점 실제 시스템 날짜)을 보여주므로,
    // 이벤트가 초기 뷰에 실제로 렌더되도록 오늘 날짜로 고정한다(다른 달로 고정하면 초기 뷰에
    // 렌더되지 않아 findByText가 타임아웃난다).
    date: dayjs().format('YYYY-MM-DD'),
    place: '본사 교육장',
    title,
    isFull: false,
    isActive: true,
    ...overrides,
  }
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

describe('FranchiseEducationCalendarPage - 정상 렌더', () => {
  it('교육 목록이 `제목 · 장소` 형식 캘린더 이벤트로 반영된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () =>
        HttpResponse.json([makeItem(1, '위생 교육')]),
      ),
    )

    renderPage()

    expect(await screen.findByText('위생 교육 · 본사 교육장')).toBeInTheDocument()
  })

  it('활성이고 정원 여유가 있는 교육에는 opacity-50 클래스가 붙지 않는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () =>
        HttpResponse.json([makeItem(2, '신메뉴 교육')]),
      ),
    )

    renderPage()

    const eventEl = await screen.findByText(/신메뉴 교육/)
    const eventRoot = eventEl.closest('.fc-event')
    expect(eventRoot).not.toHaveClass('opacity-50')
  })

  it('비활성(isActive=false) 교육은 opacity-50 클래스로 시각 구분된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () =>
        HttpResponse.json([makeItem(3, '비활성 교육', { isActive: false })]),
      ),
    )

    renderPage()

    const eventEl = await screen.findByText(/비활성 교육/)
    expect(eventEl.closest('.fc-event')).toHaveClass('opacity-50')
  })

  it('정원 마감(isFull=true) 교육은 opacity-50 클래스로 시각 구분된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () =>
        HttpResponse.json([makeItem(4, '마감 교육', { isFull: true })]),
      ),
    )

    renderPage()

    const eventEl = await screen.findByText(/마감 교육/)
    expect(eventEl.closest('.fc-event')).toHaveClass('opacity-50')
  })
})

describe('FranchiseEducationCalendarPage - 라우팅', () => {
  it('이벤트 클릭 시 /franchise-educations/{educationId}로 이동한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/franchise-educations/calendar`, () =>
        HttpResponse.json([makeItem(5, '위생 교육')]),
      ),
    )

    renderPage()

    const eventEl = await screen.findByText(/위생 교육/)
    eventEl.click()

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/franchise-educations/5'))
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
