import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { ScheduleCreateDialog } from './ScheduleCreateDialog'

/**
 * ScheduleCreateDialog(F003 `MANUAL_SCHEDULE_CREATE`, ROADMAP(SCHEDULE) T3.3) 회귀 방지 테스트.
 * MeetingRoomCreateDialog.test.tsx와 동형 패턴.
 *
 * - zod 클라 사전검증(제목/내용/시작 일시/종료 일시 필수) 실패 경로.
 * - endAt < startAt 객체 레벨 refine 실패 경로.
 * - 정상 제출 시 datetime-local(초 없음) 값에 ":00"이 보정되어 POST body로 전송됨.
 * - 제출 중 Esc/취소로 닫을 수 없는 가드.
 * - 서버 검증 실패 시 다이얼로그가 닫히지 않고 에러가 표시된다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <ScheduleCreateDialog open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
  return { onOpenChange, queryClient }
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/제목/), '팀 회의 일정')
  await user.type(screen.getByLabelText(/내용/), '주간 스크럼 진행')
  const startInput = document.getElementById('schedule-create-start') as HTMLInputElement
  const endInput = document.getElementById('schedule-create-end') as HTMLInputElement
  await user.type(startInput, '2026-07-15T10:00')
  await user.type(endInput, '2026-07-15T11:00')
}

describe('ScheduleCreateDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지 4개를 노출하고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('제목을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('내용을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('시작 일시를 입력해주세요')).toBeInTheDocument()
  })

  it('종료 일시가 시작 일시보다 이르면 인라인 에러가 뜨고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText(/제목/), '팀 회의 일정')
    await user.type(screen.getByLabelText(/내용/), '주간 스크럼 진행')
    const startInput = document.getElementById('schedule-create-start') as HTMLInputElement
    const endInput = document.getElementById('schedule-create-end') as HTMLInputElement
    await user.type(startInput, '2026-07-15T11:00')
    await user.type(endInput, '2026-07-15T10:00')

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('종료 일시는 시작 일시 이후여야 합니다')).toBeInTheDocument()
  })

  it('정상 입력 제출 시 초가 보정된 body로 POST하고, 성공 토스트+다이얼로그 닫힘이 발생한다', async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE_URL}/api/schedules`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ sourceKey: 'schedule-1' }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))

    expect(capturedBody).toEqual({
      title: '팀 회의 일정',
      content: '주간 스크럼 진행',
      startAt: '2026-07-15T10:00:00',
      endAt: '2026-07-15T11:00:00',
    })

    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('일정이 등록되었습니다')
  })

  it('제출 중에는 Esc/취소 버튼으로 닫을 수 없다', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${BASE_URL}/api/schedules`, async () => {
        await gate
        return HttpResponse.json({ sourceKey: 'schedule-1' }, { status: 201 })
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

  it('서버 검증 실패 시 다이얼로그가 닫히지 않고 에러가 표시된다', async () => {
    server.use(
      http.post(`${BASE_URL}/api/schedules`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '종료 일시는 시작 일시 이후여야 합니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('종료 일시는 시작 일시 이후여야 합니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText(/제목/)).toHaveValue('팀 회의 일정')
  })
})
