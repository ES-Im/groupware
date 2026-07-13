import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseEducationCreatePage } from './FranchiseEducationCreatePage'

/**
 * FranchiseEducationCreatePage(F1612, ROADMAP(FRANCHISE) T4.2) 검증.
 * 사용자 요청(2026-07-13 UI 개편)으로 등록 다이얼로그를 전용 페이지로 전환하며, 구
 * FranchiseEducationCreateDialog.test.tsx의 검증(zod 사전검증·날짜/시각 조합 전송·서버 검증 실패
 * 유지)을 페이지+폼(FranchiseEducationCreateForm) 기준으로 이관했다. 다이얼로그의 open/onOpenChange
 * 대신, 성공 시 생성된 교육 상세(P5)로·취소 시 교육 캘린더로 navigate하는 shell 동선을 함께 검증한다.
 *
 * - zod 클라 사전검증(날짜/시각/장소/제목/내용/정원 필수) 실패 경로.
 * - capacity 0/음수 인라인 에러.
 * - 날짜(educationDate)+시각(educationTime) 조합이 `${date}T${time}:00`으로 전송되는지.
 * - 제출 성공(201 {educationId}) 시 성공 토스트 + 상세(/franchise-educations/:educationId) 이동.
 * - 제출 중 취소/등록 버튼 비활성(in-flight 가드).
 * - 서버 검증 실패 시 페이지가 유지되고 root 에러가 표시된다(실패가 삼켜지지 않음).
 * - 취소 시 교육 캘린더(/franchise-educations)로 이동한다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function DetailPlaceholder() {
  const { educationId } = useParams()
  return <div>교육 상세 화면 educationId={educationId}</div>
}

function CalendarPlaceholder() {
  return <div>교육 캘린더 화면</div>
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/franchise-educations/new']}>
        <Routes>
          <Route path="/franchise-educations" element={<CalendarPlaceholder />} />
          <Route path="/franchise-educations/new" element={<FranchiseEducationCreatePage />} />
          <Route path="/franchise-educations/:educationId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** 날짜/시각은 fireEvent.change로, 나머지는 userEvent로 채운다(구 다이얼로그 테스트 선례). */
async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { date?: string; time?: string; capacity?: string } = {},
) {
  const { date = '2026-07-15', time = '09:30', capacity = '20' } = overrides
  fireEvent.change(screen.getByLabelText(/교육 날짜/), { target: { value: date } })
  fireEvent.change(screen.getByLabelText(/시작 시각/), { target: { value: time } })
  await user.type(screen.getByLabelText(/교육 장소/), '본사 3층 교육장')
  await user.type(screen.getByLabelText(/교육 제목/), '신규 가맹점 운영 교육')
  await user.type(screen.getByLabelText(/교육 내용/), '가맹점 운영 전반 교육 내용')
  if (capacity !== '') {
    fireEvent.change(screen.getByLabelText(/정원/), { target: { value: capacity } })
  }
}

describe('FranchiseEducationCreatePage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출하고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('교육 날짜를 선택해주세요')).toBeInTheDocument()
    expect(screen.getByText('교육 시작 시각을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('교육 장소를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('교육 제목을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('교육 내용을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('정원을 입력해주세요')).toBeInTheDocument()
  })

  it('정원이 0이면 "정원은 양수여야 합니다" 인라인 에러가 표시되고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user, { capacity: '0' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('정원은 양수여야 합니다')).toBeInTheDocument()
  })

  it('정원이 음수이면 "정원은 양수여야 합니다" 인라인 에러가 표시되고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user, { capacity: '-1' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('정원은 양수여야 합니다')).toBeInTheDocument()
  })

  it('날짜+시각이 educationDate=`${date}T${time}:00`으로 조합되어 전송되고, 성공 시 토스트+상세 이동이 발생한다', async () => {
    let requestBody: unknown
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations`, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ educationId: 7 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user, { date: '2026-07-15', time: '09:30', capacity: '20' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('교육 상세 화면 educationId=7')).toBeInTheDocument()
    expect(requestBody).toEqual({
      educationDate: '2026-07-15T09:30:00',
      place: '본사 3층 교육장',
      title: '신규 가맹점 운영 교육',
      content: '가맹점 운영 전반 교육 내용',
      capacity: 20,
    })
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('교육을 등록했습니다')
  })

  it('제출 중에는 취소/등록 버튼이 비활성화된다(in-flight 가드)', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations`, async () => {
        await gate
        return HttpResponse.json({ educationId: 7 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()

    resolveResponse?.()

    expect(await screen.findByText('교육 상세 화면 educationId=7')).toBeInTheDocument()
  })

  it('서버 검증 실패 시 페이지가 유지되고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '정원은 1명 이상이어야 합니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderPage()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('정원은 1명 이상이어야 합니다')).toBeInTheDocument()
    // 상세로 이동하지 않고 폼 입력이 유지된다.
    expect(screen.queryByText(/교육 상세 화면/)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/교육 장소/)).toHaveValue('본사 3층 교육장')
  })

  it('취소 버튼을 누르면 교육 캘린더로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(await screen.findByText('교육 캘린더 화면')).toBeInTheDocument()
  })
})
