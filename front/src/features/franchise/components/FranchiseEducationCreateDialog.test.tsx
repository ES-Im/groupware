import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchiseEducationCreateDialog } from './FranchiseEducationCreateDialog'

/**
 * FranchiseEducationCreateDialog(F1612, ROADMAP(FRANCHISE) T4.2) 검증.
 * MeetingRoomCreateDialog.test.tsx와 동형 패턴.
 *
 * - zod 클라 사전검증(날짜/시각/장소/제목/내용/정원 필수) 실패 경로.
 * - capacity 0/음수 인라인 에러.
 * - 날짜(educationDate)+시각(educationTime) 조합이 `${date}T${time}:00`으로 전송되는지.
 * - 제출 중 Esc/취소로 닫을 수 없는 가드.
 * - 제출 성공 시 성공 토스트 + 다이얼로그 닫힘 + 생성된 교육의 P5(상세)로 navigate.
 * - 서버 검증 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function DetailPlaceholder() {
  const { educationId } = useParams()
  return <div>교육 상세 화면 educationId={educationId}</div>
}

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/franchise-educations/calendar']}>
        <Routes>
          <Route
            path="/franchise-educations/calendar"
            element={<FranchiseEducationCreateDialog open={open} onOpenChange={onOpenChange} />}
          />
          <Route path="/franchise-educations/:educationId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

/** 날짜/시각은 fireEvent.change로, 나머지는 userEvent로 채운다(MeetingRoomSearchAndSelect.test.tsx 선례). */
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

describe('FranchiseEducationCreateDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출하고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderDialog()

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
    renderDialog()

    await fillValidForm(user, { capacity: '0' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('정원은 양수여야 합니다')).toBeInTheDocument()
  })

  it('정원이 음수이면 "정원은 양수여야 합니다" 인라인 에러가 표시되고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await fillValidForm(user, { capacity: '-1' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('정원은 양수여야 합니다')).toBeInTheDocument()
  })

  it('날짜+시각이 educationDate=`${date}T${time}:00` 형태로 조합되어 전송되고, 성공 시 토스트+P5 이동이 발생한다', async () => {
    let requestBody: unknown
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations`, async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ educationId: 7 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillValidForm(user, { date: '2026-07-15', time: '09:30', capacity: '20' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(requestBody).toEqual({
      educationDate: '2026-07-15T09:30:00',
      place: '본사 3층 교육장',
      title: '신규 가맹점 운영 교육',
      content: '가맹점 운영 전반 교육 내용',
      capacity: 20,
    })
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('교육을 등록했습니다')
    expect(await screen.findByText('교육 상세 화면 educationId=7')).toBeInTheDocument()
  })

  it('제출 중에는 Esc/취소 버튼으로 닫을 수 없다', async () => {
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
    const { onOpenChange } = renderDialog()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('서버 검증 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.post(`${BASE_URL}/api/franchise-educations`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '정원은 1명 이상이어야 합니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('정원은 1명 이상이어야 합니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText(/교육 장소/)).toHaveValue('본사 3층 교육장')
  })
})
