import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import type { EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { FranchiseManagerPicker } from './FranchiseManagerPicker'

const MANAGERS = [
  { empId: 1, empName: '김프랜차이즈' },
  { empId: 2, empName: '이프랜차이즈' },
]

function mockAssignableManagers(list: Array<{ empId: number; empName: string }> = MANAGERS) {
  server.use(
    http.get(`${BASE_URL}/api/franchises/assignable-managers`, () => HttpResponse.json(list)),
  )
}

function renderPicker(
  options: { selected?: EmployeePickerEmployee[]; disabledEmpIds?: number[] } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <FranchiseManagerPicker
        selected={options.selected ?? []}
        onChange={onChange}
        multiple={false}
        disabledEmpIds={options.disabledEmpIds}
      />
    </QueryClientProvider>,
  )
  return { onChange }
}

describe('FranchiseManagerPicker', () => {
  it('조회된 FRANCHISE 권한 사원이 후보 목록으로 렌더된다', async () => {
    mockAssignableManagers()
    renderPicker()

    expect(await screen.findByRole('button', { name: /김프랜차이즈/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /이프랜차이즈/ })).toBeInTheDocument()
  })

  it('후보를 클릭하면 단일 선택(multiple=false)으로 onChange가 호출된다', async () => {
    mockAssignableManagers()
    const user = userEvent.setup()
    const { onChange } = renderPicker()

    await user.click(await screen.findByRole('button', { name: /김프랜차이즈/ }))

    expect(onChange).toHaveBeenCalledWith([{ empId: 1, empName: '김프랜차이즈' }])
  })

  it('disabledEmpIds 사원은 선택 불가(disabled)로 표시된다', async () => {
    mockAssignableManagers()
    renderPicker({ disabledEmpIds: [1] })

    expect(await screen.findByRole('button', { name: /김프랜차이즈/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /이프랜차이즈/ })).not.toBeDisabled()
  })

  it('이름 검색으로 후보를 좁힌다', async () => {
    mockAssignableManagers()
    const user = userEvent.setup()
    renderPicker()

    await screen.findByRole('button', { name: /김프랜차이즈/ })
    await user.type(screen.getByRole('textbox', { name: '가맹점 담당 사원 이름 검색' }), '이프')

    expect(screen.queryByRole('button', { name: /김프랜차이즈/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /이프랜차이즈/ })).toBeInTheDocument()
  })

  it('FRANCHISE 권한 사원이 없으면 안내 문구를 렌더한다', async () => {
    mockAssignableManagers([])
    renderPicker()

    expect(await screen.findByText('가맹점 권한 사원이 없습니다.')).toBeInTheDocument()
  })
})
