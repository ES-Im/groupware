import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { DeptMemberResponse } from '../model/deptMember'
import { AppointDepartmentLeaderForm } from './AppointDepartmentLeaderForm'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const members: DeptMemberResponse[] = [
  { empId: 1, empNo: 'E001', empName: '홍길동', extensionNo: null, email: 'hong@haruon.com', position: '사원' },
  { empId: 2, empNo: 'E002', empName: '김철수', extensionNo: null, email: 'kim@haruon.com', position: '대리' },
]

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AppointDepartmentLeaderForm deptId={1} members={members} />
    </QueryClientProvider>,
  )
}

const TRIGGER_NAME = /부서장으로 지정할 사원/

async function pickLeader(user: ReturnType<typeof userEvent.setup>, empName: string | RegExp) {
  await user.click(screen.getByRole('button', { name: TRIGGER_NAME }))
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: new RegExp(empName) }))
}

describe('AppointDepartmentLeaderForm', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('빈 값 제출 시 zod 클라 사전검증 메시지를 노출한다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: '부서장 지정' }))

    expect(await screen.findByText('부서장으로 지정할 사원을 선택해주세요')).toBeInTheDocument()
    expect(screen.getByText('지정일을 선택해주세요')).toBeInTheDocument()
  })

  it('다이얼로그에 부서 멤버 후보가 모두 노출된다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: TRIGGER_NAME }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: /홍길동/ })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /김철수/ })).toBeInTheDocument()
  })

  it('성공하면 성공 토스트를 띄운다', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/appointment`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderForm()

    await pickLeader(user, '홍길동')
    await user.type(screen.getByLabelText(/지정일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '부서장 지정' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('부서장을 지정했습니다'))
  })

  it('서버 실패 시 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.patch(`${BASE_URL}/api/departments/1/leader/appointment`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '이미 부서장이 지정되어 있습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderForm()

    await pickLeader(user, '홍길동')
    await user.type(screen.getByLabelText(/지정일/), '2026-07-07')
    await user.click(screen.getByRole('button', { name: '부서장 지정' }))

    expect(await screen.findByText('이미 부서장이 지정되어 있습니다')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).not.toHaveBeenCalled()
  })
})
