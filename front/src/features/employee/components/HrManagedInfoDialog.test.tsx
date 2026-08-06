import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import type { EmpManagementRecord } from '../model/empManagement'
import { HrManagedInfoDialog } from './HrManagedInfoDialog'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const record: EmpManagementRecord = {
  empId: 7,
  empNo: '202607007',
  empName: '홍길동',
  loginId: 'hong01',
  email: 'hong@haruon.com',
  extensionNo: '101-0001',
  status: 'ACTIVE',
  hireAt: '2024-01-01',
  resignAt: null,
  belongings: [],
  systemRoleCodeName: ['EMPLOYEE'],
}

function renderDialog(open = true, recordOverride: EmpManagementRecord = record) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <HrManagedInfoDialog open={open} onOpenChange={onOpenChange} empId={7} record={recordOverride} />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('HrManagedInfoDialog - 권한 후보 제한', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
    vi.clearAllMocks()
  })

  it('순수 HR 뷰어(ADMIN 미보유)는 ADMIN 체크박스 후보가 없다', () => {
    useAuthStore.setState({ roles: ['HR'] })

    renderDialog()

    expect(screen.getByRole('checkbox', { name: '일반' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '부서관리자' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '프랜차이즈' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'IT' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '인사' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '시설' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '시스템관리자' })).not.toBeInTheDocument()
  })

  it('ADMIN 뷰어는 ADMIN 체크박스 후보가 추가된다', () => {
    useAuthStore.setState({ roles: ['ADMIN'] })

    renderDialog()

    expect(screen.getByRole('checkbox', { name: '시스템관리자' })).toBeInTheDocument()
  })
})

describe('HrManagedInfoDialog - 초기값', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
    vi.clearAllMocks()
  })

  it('record 값으로 폼이 초기화된다(비밀번호는 매번 빈 값)', () => {
    useAuthStore.setState({ roles: ['HR'] })

    renderDialog()

    expect(screen.getByLabelText('이름')).toHaveValue('홍길동')
    expect(screen.getByLabelText('새 비밀번호')).toHaveValue('')
    expect(screen.getByLabelText('내선번호')).toHaveValue('101-0001')
    expect(screen.getByLabelText('입사일자')).toHaveValue('2024-01-01')
    expect(screen.getByRole('checkbox', { name: '일반' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: '부서관리자' })).not.toBeChecked()
  })
})

describe('HrManagedInfoDialog - 제출', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
    vi.clearAllMocks()
  })

  it('클라 사전검증 실패(형식에 안 맞는 비밀번호)면 네트워크 요청 없이 에러 메시지를 보여준다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/hr-managed-info`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('새 비밀번호'), 'ab1!')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument()
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('비밀번호를 비워두면 검증을 통과하고 password 필드 없이 전송된다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/hr-managed-info`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(capturedBody).toEqual({
      empName: '홍길동',
      extensionNo: '101-0001',
      systemRoleCode: ['EMPLOYEE'],
      hireAt: '2024-01-01',
    })
  })

  it('내선번호를 비워두면 검증을 통과하고 extensionNo 필드 없이 전송된다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/hr-managed-info`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByLabelText('내선번호'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(capturedBody).toEqual({
      empName: '홍길동',
      systemRoleCode: ['EMPLOYEE'],
      hireAt: '2024-01-01',
    })
  })

  it('대상 사원이 후보 밖 권한(ADMIN)을 이미 보유하면 권한 체크박스가 잠기고 제출 시 systemRoleCode가 생략된다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    const recordWithAdmin: EmpManagementRecord = { ...record, systemRoleCodeName: ['EMPLOYEE', 'ADMIN'] }
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/hr-managed-info`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog(true, recordWithAdmin)

    expect(screen.getByRole('checkbox', { name: '일반' })).toBeDisabled()
    expect(screen.getByText(/관리할 수 없는 권한/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(capturedBody).toEqual({
      empName: '홍길동',
      extensionNo: '101-0001',
      hireAt: '2024-01-01',
    })
  })

  it('유효한 값으로 제출하면 empId·values를 그대로 보내 성공(204) 후 다이얼로그를 닫는다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/hr-managed-info`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText('새 비밀번호'), 'abc12345!')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(capturedBody).toEqual({
      empName: '홍길동',
      password: 'abc12345!',
      extensionNo: '101-0001',
      systemRoleCode: ['EMPLOYEE'],
      hireAt: '2024-01-01',
    })
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('사원 정보를 수정했습니다')
  })

  it('서버 검증 실패(HR이 ADMIN 부여 시도 등) 시 다이얼로그가 닫히지 않고 root 에러가 표시된다', async () => {
    useAuthStore.setState({ roles: ['HR'] })
    server.use(
      http.patch(`${BASE_URL}/api/employees/7/hr-managed-info`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: 'HR은 ADMIN 권한을 부여할 수 없습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.type(screen.getByLabelText('새 비밀번호'), 'abc12345!')
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('HR은 ADMIN 권한을 부여할 수 없습니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
