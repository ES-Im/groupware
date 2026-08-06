import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { UpdateDepartmentParentForm } from './UpdateDepartmentParentForm'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function deptSummary(deptId: number, deptName: string) {
  return {
    deptInfoResponse: { deptId, deptCode: String(deptId).padStart(3, '0'), deptName, isActive: true, parentDeptId: null },
    deptLeader: { empId: null, empNo: null, empName: null, extensionNo: null, email: null, position: null },
  }
}

function candidatesPage(items: ReturnType<typeof deptSummary>[]) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 100,
    first: true,
    last: true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function renderForm(currentParentDeptId: number | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <UpdateDepartmentParentForm deptId={1} currentParentDeptId={currentParentDeptId} />
    </QueryClientProvider>,
  )
}

describe('UpdateDepartmentParentForm - 후보 목록 엣지케이스', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('현재 상위 부서가 활성 후보 목록에 있으면 그 옵션이 선택된 상태로 표시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(candidatesPage([deptSummary(2, '개발본부'), deptSummary(3, '영업본부')])),
      ),
    )

    renderForm(2)

    await screen.findByText('개발본부 (002)')
    expect(screen.getByRole('combobox')).toHaveValue('2')
    expect(screen.queryByText(/비활성 또는 목록 범위 밖/)).not.toBeInTheDocument()
  })

  it('[회귀] 폴백 옵션이 실제 후보 옵션으로 교체되는 순간, 네이티브 select가 일시적으로 선택값을 잃는다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, async () => {
        await delay(10)
        return HttpResponse.json(candidatesPage([deptSummary(2, '개발본부'), deptSummary(3, '영업본부')]))
      }),
    )

    renderForm(2)

    const select = (await screen.findByRole('combobox')) as HTMLSelectElement
    expect(select).toHaveValue('2')

    const valuesObservedDuringOptionSwap: string[] = []
    const observer = new MutationObserver(() => {
      valuesObservedDuringOptionSwap.push(select.value)
    })
    observer.observe(select, { childList: true })

    await screen.findByText('개발본부 (002)')
    observer.disconnect()

    expect(valuesObservedDuringOptionSwap).toContain('')

    expect(select).toHaveValue('2')
  })

  it('현재 상위 부서가 후보 목록(활성/size100/자기제외)에 없으면 별도 옵션으로 주입해 select가 현재 값을 표시한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')])),
      ),
    )

    renderForm(99)

    await waitFor(() => expect(screen.getByText(/현재 상위 부서\(ID: 99/)).toBeInTheDocument())
    expect(screen.getByRole('combobox')).toHaveValue('99')
  })

  it('자기 자신(deptId)은 후보 목록에서 제외된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(candidatesPage([deptSummary(1, '본사(자기자신)'), deptSummary(2, '개발본부')])),
      ),
    )

    renderForm(null)

    await waitFor(() => expect(screen.getByText('개발본부 (002)')).toBeInTheDocument())
    expect(screen.queryByText('본사(자기자신) (001)')).not.toBeInTheDocument()
  })

  it('"최상위로 이동" 선택 후 제출하면 parentDeptId 쿼리 파라미터 자체가 전달되지 않는다', async () => {
    const patchSpy = vi.fn()
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')])),
      ),
      http.patch(`${BASE_URL}/api/departments/1/parent`, ({ request }) => {
        const url = new URL(request.url)
        patchSpy(url.searchParams.has('parentDeptId'))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderForm(2)

    await screen.findByText('개발본부 (002)')
    await user.selectOptions(screen.getByRole('combobox'), '최상위로 이동')
    await user.click(screen.getByRole('button', { name: '상위 부서 변경' }))

    await waitFor(() => expect(patchSpy).toHaveBeenCalledWith(false))
  })

  it('후보 목록 조회 실패 시 토스트로 알리고, select는 "최상위로 이동" 옵션만으로도 계속 동작한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(
          { code: 'COMMON_001', name: 'INTERNAL_SERVER_ERROR', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )

    renderForm(null)

    expect(
      await screen.findByText('후보 목록을 불러오지 못했습니다. 선택지가 불완전할 수 있습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '최상위로 이동' })).toBeInTheDocument()
  })
})

describe('UpdateDepartmentParentForm - 성공/실패 처리', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('성공하면 성공 토스트를 띄운다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
      http.patch(`${BASE_URL}/api/departments/1/parent`, () => new HttpResponse(null, { status: 204 })),
    )
    const user = userEvent.setup()
    renderForm(null)

    await screen.findByText('개발본부 (002)')
    await user.selectOptions(screen.getByRole('combobox'), '2')
    await user.click(screen.getByRole('button', { name: '상위 부서 변경' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('상위 부서를 변경했습니다'))
  })

  it('서버 실패 시 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
      http.patch(`${BASE_URL}/api/departments/1/parent`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', name: 'VALIDATION_ERROR', httpStatus: 400, message: '순환 참조가 발생합니다' },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderForm(null)

    await screen.findByText('개발본부 (002)')
    await user.selectOptions(screen.getByRole('combobox'), '2')
    await user.click(screen.getByRole('button', { name: '상위 부서 변경' }))

    expect(await screen.findByText('순환 참조가 발생합니다')).toBeInTheDocument()
    const { toast } = await import('sonner')
    expect(toast.success).not.toHaveBeenCalled()
  })
})
