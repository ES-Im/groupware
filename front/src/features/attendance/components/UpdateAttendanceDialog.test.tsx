import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { AttendanceEditTarget } from '../model/deptAttendance'
import { UpdateAttendanceDialog } from './UpdateAttendanceDialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const DEFAULT_TARGET: AttendanceEditTarget = {
  targetEmpId: 1,
  attendanceId: 10,
  startAt: '09:00:00',
  endAt: '18:00:00',
}

function renderDialog(target: AttendanceEditTarget | null = DEFAULT_TARGET, open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <UpdateAttendanceDialog open={open} onOpenChange={onOpenChange} target={target} />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

function setTimeValue(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } })
}

describe('UpdateAttendanceDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('open+target으로 시작/종료 시각 입력값이 채워진다', () => {
    renderDialog()

    expect(screen.getByLabelText('시작 시각')).toHaveValue('09:00:00')
    expect(screen.getByLabelText('종료 시각')).toHaveValue('18:00:00')
  })

  it('startAt/endAt을 둘 다 비우고 제출하면 zod object-level refine 에러가 노출된다', async () => {
    const user = userEvent.setup()
    renderDialog()

    setTimeValue(screen.getByLabelText('시작 시각'), '')
    setTimeValue(screen.getByLabelText('종료 시각'), '')
    await user.type(screen.getByLabelText(/수정 사유/), '사유입니다')
    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(
      await screen.findByText('시작 또는 종료 시각 중 하나는 입력해야 합니다'),
    ).toBeInTheDocument()
  })

  it('수정 사유를 비우고 제출하면 필수 입력 에러가 노출된다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByText('수정 사유를 입력해주세요')).toBeInTheDocument()
  })

  it('수정 사유가 100자를 초과하면 zod 검증 에러가 노출된다', async () => {
    renderDialog()

    const reasonField = screen.getByLabelText(/수정 사유/)
    fireEvent.change(reasonField, { target: { value: 'a'.repeat(101) } })
    fireEvent.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByText('수정 사유는 100자 이하로 입력해주세요')).toBeInTheDocument()
  })

  it('제출 성공(204) 시 onOpenChange(false)가 호출된다', async () => {
    let requestBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/attendances/10`, async ({ request }) => {
        requestBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/수정 사유/), '오전 반차 정정')
    await user.click(screen.getByRole('button', { name: '수정' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(requestBody).toMatchObject({
      targetEmpId: 1,
      startAt: '09:00:00',
      endAt: '18:00:00',
      editReason: '오전 반차 정정',
    })
  })

  it('제출 중에는 Esc/취소 버튼으로 닫을 수 없다', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.patch(`${BASE_URL}/api/employees/attendances/10`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/수정 사유/), '오전 반차 정정')
    await user.click(screen.getByRole('button', { name: '수정' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('서버 에러(이미 승인된 근태 수정 시도 등) 시 다이얼로그가 닫히지 않고 에러가 표시된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/employees/attendances/10`, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            name: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: '이미 승인된 근태는 수정할 수 없습니다',
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/수정 사유/), '오전 반차 정정')
    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByText('이미 승인된 근태는 수정할 수 없습니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText(/수정 사유/)).toHaveValue('오전 반차 정정')
  })
})
