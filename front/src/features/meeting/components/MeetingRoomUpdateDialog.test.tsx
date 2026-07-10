import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { MeetingRoomDetail } from '../model/meeting'
import { MeetingRoomUpdateDialog } from './MeetingRoomUpdateDialog'

/**
 * MeetingRoomUpdateDialog(F813, ROADMAP(MEETING-ROOMS) T7.2-b) 검증.
 * RegisterDepartmentDialog.test.tsx/MeetingRoomCreateDialog.test.tsx와 동형 패턴.
 *
 * 핵심 검증 축:
 * - 열릴 때 detail 값으로 프리필된다.
 * - buildUpdatePayload: 바뀐 필드만 PATCH body에 담긴다(평탄화 아님, diff).
 * - capacity는 setValueAs 계약(빈 문자열→undefined) — 지워서 제출해도 zod 검증을 통과하고,
 *   payload에서 capacity가 생략된다(값 변경 안 함 의도 보존).
 * - 잘못된 capacity(0 이하)는 zod 에러로 제출이 막힌다.
 * - 서버 검증 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다.
 * - 성공 시 성공 토스트 + 다이얼로그 닫힘.
 */
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  vi.clearAllMocks()
})

const DETAIL: MeetingRoomDetail = {
  meetingRoomId: 1,
  name: '대회의실',
  description: '층별 대형 회의실',
  capacity: 10,
  isAvailable: true,
}

function renderDialog(open = true, detail: MeetingRoomDetail = DETAIL) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <MeetingRoomUpdateDialog
        open={open}
        onOpenChange={onOpenChange}
        meetingRoomId={detail.meetingRoomId}
        detail={detail}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('MeetingRoomUpdateDialog - 프리필', () => {
  it('열릴 때 현재 상세값(name/description/capacity)으로 입력값을 채운다', () => {
    renderDialog()

    expect(screen.getByLabelText('이름')).toHaveValue('대회의실')
    expect(screen.getByLabelText('설명')).toHaveValue('층별 대형 회의실')
    expect(screen.getByLabelText('수용 인원')).toHaveValue(10)
  })
})

describe('MeetingRoomUpdateDialog - 변경 필드만 PATCH(diff)', () => {
  it('이름만 바꿔 제출하면 PATCH body에 name만 담기고 description/capacity는 포함되지 않는다', async () => {
    let receivedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const nameInput = screen.getByLabelText('이름')
    await user.clear(nameInput)
    await user.type(nameInput, '소회의실')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(receivedBody).toEqual({ name: '소회의실' }))
  })

  it('수용 인원을 지워서 제출하면(setValueAs로 undefined 변환) zod 검증을 통과하고 payload에서 capacity가 생략된다', async () => {
    let receivedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const nameInput = screen.getByLabelText('이름')
    await user.clear(nameInput)
    await user.type(nameInput, '소회의실')
    await user.clear(screen.getByLabelText('수용 인원'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(receivedBody).toEqual({ name: '소회의실' }))
    expect(receivedBody).not.toHaveProperty('capacity')
  })

  it('아무 필드도 바꾸지 않고 제출하면 빈 payload({})가 그대로 전송된다', async () => {
    let receivedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1`, async ({ request }) => {
        receivedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(receivedBody).toEqual({}))
  })
})

describe('MeetingRoomUpdateDialog - zod 클라 사전검증', () => {
  it('수용 인원에 0을 입력하면 "수용 인원은 양수여야 합니다" 에러를 노출하고 요청을 보내지 않는다', async () => {
    let patchCalled = false
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1`, () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    const capacityInput = screen.getByLabelText('수용 인원')
    await user.clear(capacityInput)
    await user.type(capacityInput, '0')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('수용 인원은 양수여야 합니다')).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })
})

describe('MeetingRoomUpdateDialog - 제출 성공/실패', () => {
  it('제출 성공 시 성공 토스트가 뜨고 다이얼로그가 닫힌다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    const nameInput = screen.getByLabelText('이름')
    await user.clear(nameInput)
    await user.type(nameInput, '소회의실')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('회의실 정보를 수정했습니다')
  })

  it('서버 검증 실패(변경값 없음 등) 시 다이얼로그가 닫히지 않고 root 에러가 표시된다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/meeting-rooms/1`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '변경된 값이 없습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('변경된 값이 없습니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
