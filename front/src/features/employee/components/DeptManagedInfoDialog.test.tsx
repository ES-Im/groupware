import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/mocks/server'
import type { EmpManagementRecord } from '../model/empManagement'
import { DeptManagedInfoDialog } from './DeptManagedInfoDialog'

/**
 * DeptManagedInfoDialog(`DEPT_MANAGER_UPDATE_EMP_INFO`, DEPT_MANAGER 전용) 검증.
 * request-fields.adoc: "[FRANCHISE,IT,HR,FACILITY 중 부서 매니저가 가진 권한]" — 뷰어(authStore
 * 원본 roles)와 LAYER2_ROLE_CODES의 교집합만 후보로 추가되는지 확인한다.
 */

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const record: EmpManagementRecord = {
  empId: 9,
  empNo: '202607009',
  empName: '김철수',
  loginId: 'kim01',
  email: 'kim@haruon.com',
  extensionNo: '101-0002',
  status: 'ACTIVE',
  hireAt: '2024-02-01',
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
      <DeptManagedInfoDialog open={open} onOpenChange={onOpenChange} empId={9} record={recordOverride} />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('DeptManagedInfoDialog - 권한 후보 제한', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
    vi.clearAllMocks()
  })

  it('뷰어가 Layer-2 권한이 없으면 EMPLOYEE/DEPT_MANAGER 후보만 노출된다', () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })

    renderDialog()

    expect(screen.getByRole('checkbox', { name: '일반' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '부서관리자' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '프랜차이즈' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'IT' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '인사' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '시설' })).not.toBeInTheDocument()
  })

  it('뷰어가 IT 권한을 가지면 IT만 후보에 추가되고 나머지 Layer-2는 추가되지 않는다', () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER', 'IT'] })

    renderDialog()

    expect(screen.getByRole('checkbox', { name: 'IT' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '프랜차이즈' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '인사' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '시설' })).not.toBeInTheDocument()
  })

  it('뷰어가 FRANCHISE·HR을 모두 가지면 두 후보 모두 추가된다', () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER', 'FRANCHISE', 'HR'] })

    renderDialog()

    expect(screen.getByRole('checkbox', { name: '프랜차이즈' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '인사' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'IT' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: '시설' })).not.toBeInTheDocument()
  })

  it('DeptManagedInfoDialog는 HrManagedInfoDialog와 달리 이름/비밀번호/입사일자 필드를 다루지 않는다', () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })

    renderDialog()

    expect(screen.queryByLabelText('이름')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('새 비밀번호')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('입사일자')).not.toBeInTheDocument()
  })
})

describe('DeptManagedInfoDialog - 제출', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, roles: [], status: 'idle' })
    vi.clearAllMocks()
  })

  it('클라 사전검증 실패(권한 전체 해제)면 네트워크 요청 없이 에러 메시지를 보여준다', async () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })
    const patchSpy = vi.fn()
    server.use(
      http.patch(`${BASE_URL}/api/employees/9/dept-managed-info`, () => {
        patchSpy()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('checkbox', { name: '일반' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('권한을 최소 1개 선택해주세요')).toBeInTheDocument()
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('유효한 값으로 제출하면 empId·values를 그대로 보내 성공(204) 후 다이얼로그를 닫는다', async () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/9/dept-managed-info`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(capturedBody).toEqual({ extensionNo: '101-0002', systemRoleCode: ['EMPLOYEE'] })
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('사원 정보를 수정했습니다')
  })

  // EmpUpdateRequestByDeptManager.java 실측: partial-update 계약이라 내선번호를 비워두면 요청
  // 바디에서 아예 제외돼야 한다(실사용 검증 중 발견한 UX 결함 수정 — 권한만 바꾸려 해도 내선번호
  // 재입력을 강제하던 문제).
  it('내선번호를 비워두면 검증을 통과하고 extensionNo 필드 없이 전송된다', async () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/9/dept-managed-info`, async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.clear(screen.getByLabelText('내선번호'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(capturedBody).toEqual({ systemRoleCode: ['EMPLOYEE'] })
  })

  // 서버(EmpCommandService.validateAssignableRolesByDeptManager +
  // EmpUpdateRequestByDeptManager 컴팩트 생성자)는 부서매니저가 자신의 후보 밖 권한(예: ADMIN,
  // 본인이 갖지 않은 Layer-2)을 배열에 "포함해 재전송"하는 것도 하드 거부한다(새로 부여하려는
  // 시도가 아니어도) — 체크박스로 제거된 걸로 보내면 조용히 제거되고, 보존하려 포함하면
  // 거부되므로 이 다이얼로그는 후보 밖 권한이 있으면 권한 편집 자체를 잠그고 systemRoleCode를
  // 아예 생략한다.
  it('대상 사원이 후보 밖 권한(ADMIN)을 이미 보유하면 권한 체크박스가 잠기고 제출 시 systemRoleCode가 생략된다', async () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })
    const recordWithAdmin: EmpManagementRecord = { ...record, systemRoleCodeName: ['EMPLOYEE', 'ADMIN'] }
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE_URL}/api/employees/9/dept-managed-info`, async ({ request }) => {
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
    expect(capturedBody).toEqual({ extensionNo: '101-0002' })
  })

  it('서버 검증 실패(상위 권한 부여 시도 등) 시 다이얼로그가 닫히지 않고 root 에러가 표시된다', async () => {
    useAuthStore.setState({ roles: ['DEPT_MANAGER'] })
    server.use(
      http.patch(`${BASE_URL}/api/employees/9/dept-managed-info`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '부서매니저는 상위 권한을 부여할 수 없습니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog()

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('부서매니저는 상위 권한을 부여할 수 없습니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
