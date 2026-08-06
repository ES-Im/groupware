import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { MeetingParticipantsReplaceDialog } from './MeetingParticipantsReplaceDialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function pageOf(items: unknown[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    numberOfElements: items.length,
    first: true,
    last: true,
    empty: items.length === 0,
  }
}

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: { deptId, deptCode: String(deptId).padStart(3, '0'), deptName, isActive: true, parentDeptId: null },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function mockDeptPickers() {
  server.use(
    http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(pageOf([deptSummary(1, '개발팀')]))),
    http.get(`${BASE_URL}/api/departments/1/members`, () =>
      HttpResponse.json(
        pageOf([
          { empId: 101, empNo: 'E101', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '사원' },
        ]),
      ),
    ),
  )
}

const PARTICIPANTS = [{ empId: 201, deptName: '영업팀', empName: '박영희' }]

function renderDialog({ open = true, onOpenChange = vi.fn() } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MeetingParticipantsReplaceDialog
          meetingId={10}
          participants={PARTICIPANTS}
          open={open}
          onOpenChange={onOpenChange}
        />
      </QueryClientProvider>,
    ),
  }
}

describe('MeetingParticipantsReplaceDialog - 선반영/게이팅', () => {
  it('열릴 때 기존 참여자를 선택 칩으로 선반영한다', () => {
    mockDeptPickers()
    renderDialog()

    expect(screen.getByText('박영희')).toBeInTheDocument()
  })

  it('선택을 전부 해제하면(0명) 저장 버튼이 비활성이다', async () => {
    mockDeptPickers()
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: '박영희 선택 해제' }))

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })
})

describe('MeetingParticipantsReplaceDialog - 저장 성공', () => {
  it('저장 시 PATCH .../participants를 현재 선택 전체로 호출하고 성공 토스트 + 닫기', async () => {
    mockDeptPickers()
    let requestedBody: Record<string, unknown> | undefined
    server.use(
      http.patch(`${BASE_URL}/api/meetings/10/participants`, async ({ request }) => {
        requestedBody = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(requestedBody).toEqual({ participantIds: [201] }))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('참여자를 교체했습니다'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('MeetingParticipantsReplaceDialog - 저장 실패', () => {
  it('서버 위반(403) 시 handleApiError 토스트만 뜨고 onOpenChange(false)는 호출되지 않는다', async () => {
    mockDeptPickers()
    server.use(
      http.patch(`${BASE_URL}/api/meetings/10/participants`, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 403, message: '예약자 본인만 교체할 수 있습니다' },
          { status: 403 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('예약자 본인만 교체할 수 있습니다'))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
