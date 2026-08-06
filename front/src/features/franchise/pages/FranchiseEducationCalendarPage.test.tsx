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

  it('[교육 등록] 버튼 클릭 시 페이지 이동 없이 등록 모달이 열리고 비활성 안내가 표시된다', async () => {
    mockCalendar([])
    const user = userEvent.setup()

    renderPage()
    mockNavigate.mockClear()

    await user.click(screen.getByRole('button', { name: '교육 등록' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: '교육 등록' })).toBeInTheDocument()
    expect(within(dialog).getByText('비활성 상태')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/교육 제목/)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
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
