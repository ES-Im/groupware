import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmployeeProfileTabs } from './EmployeeProfileTabs'
import type { EmployeeInfoResponse } from '../model/me'

function makeData(): EmployeeInfoResponse {
  return {
    empBasicInfo: {
      empId: 1,
      empNo: '202607001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'hong@haruon.com',
      extensionNo: '000-1234',
    },
    activeFiles: [],
    currentDepts: [
      { deptId: 1, deptCode: 'D1', deptName: '개발팀', positionName: '팀장', isPrimary: true, startAt: '2024-01-01', endAt: null },
      { deptId: 2, deptCode: 'D2', deptName: '기획팀', positionName: '사원', isPrimary: false, startAt: '2025-01-01', endAt: null },
    ],
  }
}

function renderTabs(viewerIsSelf: boolean) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmployeeProfileTabs data={makeData()} empId={1} viewerIsSelf={viewerIsSelf} />
    </QueryClientProvider>,
  )
}

describe('EmployeeProfileTabs - 직위 파생', () => {
  it('"직위" 필드는 대표부서(isPrimary)의 positionName을 보여준다(겸직 부서 직위가 아님)', () => {
    renderTabs(true)

    const label = screen.getByText('직위')
    const value = label.closest('div')?.querySelector('dd')
    expect(value).toHaveTextContent('팀장')
    expect(screen.queryByText('사원')).not.toBeInTheDocument()
  })
})

describe('EmployeeProfileTabs - viewerIsSelf=false', () => {
  it('아이디 필드와 "파일관리" 탭이 모두 노출되지 않는다', () => {
    renderTabs(false)

    expect(screen.queryByText('아이디')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '파일관리' })).not.toBeInTheDocument()
    expect(screen.queryByText('전자서명 첨부')).not.toBeInTheDocument()
  })
})

describe('EmployeeProfileTabs - viewerIsSelf=true', () => {
  it('"파일관리" 탭 클릭 시 EmpFileManagementPanel이 마운트되어 파일 목록을 조회한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me/files`, () =>
        HttpResponse.json([
          { file: { fileId: 9, originalName: 'sig.png', extension: 'png', fileSize: 100 }, type: 'SIGNATURE', isActive: true },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderTabs(true)

    await user.click(screen.getByRole('tab', { name: '파일관리' }))

    await waitFor(() => expect(screen.getByText('sig.png · 0.0 MB')).toBeInTheDocument())
  })
})

describe('EmployeeProfileTabs - 상태 메모 미노출', () => {
  it('"상태 메모"는 기본정보/부서이력 어느 탭에도 렌더되지 않는다', async () => {
    server.use(http.get(`${BASE_URL}/api/employees/1/belongings`, () => HttpResponse.json([])))
    const user = userEvent.setup()
    renderTabs(true)

    expect(screen.queryByText('상태 메모')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '부서이력' }))
    expect(screen.queryByText('상태 메모')).not.toBeInTheDocument()
  })
})

describe('EmployeeProfileTabs - 부서이력 탭', () => {
  it('종료된 부서 이력도 함께 렌더된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/1/belongings`, () =>
        HttpResponse.json([
          { deptId: 1, deptCode: 'D1', deptName: '개발팀', positionName: '팀장', isPrimary: true, startAt: '2025-01-01', endAt: null },
          { deptId: 3, deptCode: 'D3', deptName: '영업팀', positionName: '사원', isPrimary: false, startAt: '2023-01-01', endAt: '2024-12-31' },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderTabs(true)

    await user.click(screen.getByRole('tab', { name: '부서이력' }))

    expect(await screen.findByText('개발팀')).toBeInTheDocument()
    expect(screen.getByText('영업팀')).toBeInTheDocument()
    expect(screen.getByText('2024-12-31')).toBeInTheDocument()
  })
})
