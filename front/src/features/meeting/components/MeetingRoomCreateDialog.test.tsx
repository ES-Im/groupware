import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingRoomCreateDialog } from './MeetingRoomCreateDialog'

/**
 * MeetingRoomCreateDialog(F812, ROADMAP(MEETING-ROOMS) T6.3-b) 검증.
 * RegisterDepartmentDialog.test.tsx와 동형 패턴.
 *
 * - zod 클라 사전검증(이름/설명 필수, 수용인원 미입력) 실패 경로.
 * - 제출 중 Esc/취소로 닫을 수 없는 가드.
 * - 제출 성공 시 성공 토스트 + 다이얼로그 닫힘 + 생성된 회의실의 P7(관리 상세)로 navigate.
 * - 서버 검증 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function DetailPlaceholder() {
  const { meetingRoomId } = useParams()
  return <div>회의실 관리 상세 화면 meetingRoomId={meetingRoomId}</div>
}

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/meeting-rooms/management']}>
        <Routes>
          <Route
            path="/meeting-rooms/management"
            element={<MeetingRoomCreateDialog open={open} onOpenChange={onOpenChange} />}
          />
          <Route path="/meeting-rooms/management/:meetingRoomId" element={<DetailPlaceholder />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('MeetingRoomCreateDialog', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출하고 요청을 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('회의실 이름을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('회의실 설명을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText('수용 인원을 입력해주세요')).toBeInTheDocument()
  })

  it('제출 중에는 Esc/취소 버튼으로 닫을 수 없고, 응답 도착 후 성공 토스트+P7 이동이 발생한다', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.post(`${BASE_URL}/api/meeting-rooms`, async () => {
        await gate
        return HttpResponse.json({ meetingRoomId: 42 }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/이름/), '대회의실')
    await user.type(screen.getByLabelText(/설명/), '층별 대형 회의실')
    await user.type(screen.getByLabelText(/수용 인원/), '12')
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('회의실을 등록했습니다')
    expect(await screen.findByText('회의실 관리 상세 화면 meetingRoomId=42')).toBeInTheDocument()
  })

  it('서버 검증 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.post(`${BASE_URL}/api/meeting-rooms`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 존재하는 회의실 이름입니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText(/이름/), '대회의실')
    await user.type(screen.getByLabelText(/설명/), '층별 대형 회의실')
    await user.type(screen.getByLabelText(/수용 인원/), '12')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('이미 존재하는 회의실 이름입니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByLabelText(/이름/)).toHaveValue('대회의실')
  })
})
