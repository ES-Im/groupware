import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpManagementSection } from './EmpManagementSection'

/**
 * EmpManagementSection(사원 상세 관리 섹션, adapt-ui 신규) 검증.
 * useEmpForManagementQuery 로딩/빈 상태 분기와, canManageAsHr 우선순위에 따라
 * HrManagedInfoDialog/DeptManagedInfoDialog 중 어느 쪽 폼이 열리는지를 확인한다.
 */

function makeRecord() {
  return {
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
    systemRoleCodeName: ['EMPLOYEE', 'DEPT_MANAGER'],
  }
}

function mockManagementList() {
  server.use(
    http.get(`${BASE_URL}/api/employees`, () =>
      HttpResponse.json({
        content: [makeRecord()],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 100,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false,
      }),
    ),
  )
}

function renderSection(props: { canManageAsHr: boolean; canManageAsDeptManager: boolean }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmpManagementSection empId={7} deptId={1} {...props} />
    </QueryClientProvider>,
  )
}

describe('EmpManagementSection - 로딩/빈 상태', () => {
  it('조회 중에는 로딩 문구를 보여준다', () => {
    server.use(http.get(`${BASE_URL}/api/employees`, () => new Promise(() => {})))

    renderSection({ canManageAsHr: true, canManageAsDeptManager: false })

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument()
  })

  it('레코드를 찾지 못하면(빈 목록) 조회 실패 문구를 보여준다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees`, () =>
        HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 100,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        }),
      ),
    )

    renderSection({ canManageAsHr: true, canManageAsDeptManager: false })

    expect(await screen.findByText('관리 정보를 불러오지 못했습니다.')).toBeInTheDocument()
  })
})

describe('EmpManagementSection - 조회 성공', () => {
  it('근무 상태/입사일/시스템 권한 배지를 표시한다', async () => {
    mockManagementList()

    renderSection({ canManageAsHr: true, canManageAsDeptManager: false })

    expect(await screen.findByText('재직중')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
    expect(screen.getByText('일반')).toBeInTheDocument()
    expect(screen.getByText('부서관리자')).toBeInTheDocument()
  })
})

describe('EmpManagementSection - 다이얼로그 분기', () => {
  it('canManageAsHr=true면 "정보 수정" 클릭 시 HR 폼(이름/비밀번호/입사일자 필드)이 열린다', async () => {
    mockManagementList()
    const user = userEvent.setup()

    renderSection({ canManageAsHr: true, canManageAsDeptManager: false })

    await user.click(await screen.findByRole('button', { name: '정보 수정' }))

    expect(screen.getByRole('heading', { name: '사원 정보 수정 (HR)' })).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('입사일자')).toBeInTheDocument()
  })

  it('canManageAsHr=false·canManageAsDeptManager=true면 부서매니저 폼(내선번호만)이 열린다', async () => {
    mockManagementList()
    const user = userEvent.setup()

    renderSection({ canManageAsHr: false, canManageAsDeptManager: true })

    await user.click(await screen.findByRole('button', { name: '정보 수정' }))

    expect(screen.getByRole('heading', { name: '사원 정보 수정 (부서매니저)' })).toBeInTheDocument()
    expect(screen.queryByLabelText('이름')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('새 비밀번호')).not.toBeInTheDocument()
  })

  it('canManageAsHr=true·canManageAsDeptManager=true여도 HR 폼이 우선한다', async () => {
    mockManagementList()
    const user = userEvent.setup()

    renderSection({ canManageAsHr: true, canManageAsDeptManager: true })

    await user.click(await screen.findByRole('button', { name: '정보 수정' }))

    expect(screen.getByRole('heading', { name: '사원 정보 수정 (HR)' })).toBeInTheDocument()
  })
})
