import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { UpdateDepartmentParentDialog } from './UpdateDepartmentParentDialog'

/**
 * UpdateDepartmentParentDialog(F207, T9.3) 검증.
 *
 * - 후보 목록(DEPTS isActive=true size=100)에 현재 상위 부서가 없으면(비활성/범위 밖) 별도
 *   옵션으로 주입되어 select가 실제 현재 값을 표시해야 한다.
 * - "최상위로 이동" 선택 시 parentDeptId 쿼리 파라미터 자체가 전달되지 않아야 한다(optional 처리).
 * - 표준 닫힘 가드/실패 비삼킴 패턴.
 */
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

function renderDialog(currentParentDeptId: number | null, open = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <UpdateDepartmentParentDialog
        open={open}
        onOpenChange={onOpenChange}
        deptId={1}
        currentParentDeptId={currentParentDeptId}
      />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

describe('UpdateDepartmentParentDialog - 후보 목록 엣지케이스', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('현재 상위 부서가 활성 후보 목록에 있으면 그 옵션이 선택된 상태로 표시된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(candidatesPage([deptSummary(2, '개발본부'), deptSummary(3, '영업본부')])),
      ),
    )

    renderDialog(2)

    // 후보 목록(개발본부)이 실제로 도착할 때까지 기다린 뒤에야 폴백 주입 여부를 판정할 수 있다
    // (도착 전에는 candidates가 빈 배열이라 일시적으로 폴백 옵션이 함께 나타날 수 있음).
    await screen.findByText('개발본부 (002)')
    // 최종 settled 값은 올바르다 — reset useEffect가 candidatesQuery.isSuccess 전이 시 한 번 더
    // 실행되어 값을 재적용한다(UpdateDepartmentParentDialog.tsx 참조).
    expect(screen.getByRole('combobox')).toHaveValue('2')
    expect(screen.queryByText(/비활성 또는 목록 범위 밖/)).not.toBeInTheDocument()
  })

  it('[회귀] 폴백 옵션이 실제 후보 옵션으로 교체되는 순간, 네이티브 select가 일시적으로 선택값을 잃는다', async () => {
    // 위 테스트가 검증하는 "최종 settled 값"과 별개로, 그 값에 도달하기까지의 과정에 실제 결함이 있다.
    // GET /api/departments가 렌더 이후 비동기로 도착하도록(delay) 만들어 폴백 옵션 → 실제 후보 옵션
    // 전환을 강제로 유도하고, MutationObserver로 그 전환이 일어나는 DOM 커밋 시점의 select.value를
    // "동기적으로"(React의 이후 passive effect 재실행보다 먼저) 관찰한다. 이 방식은 실제 시스템 부하나
    // React 스케줄러 타이밍에 좌우되지 않으므로 결정적으로(항상 동일하게) 결함을 재현한다.
    //
    // 결함 원인/수정 방향은 UpdateDepartmentParentDialog.tsx의 reset useEffect 위 //todo 참조.
    server.use(
      http.get(`${BASE_URL}/api/departments`, async () => {
        await delay(10)
        return HttpResponse.json(candidatesPage([deptSummary(2, '개발본부'), deptSummary(3, '영업본부')]))
      }),
    )

    renderDialog(2)

    const select = (await screen.findByRole('combobox')) as HTMLSelectElement
    // 초기(폴백) 상태: 후보 목록이 아직 로딩 중이므로 폴백 옵션(value=2)으로 채워져 있어야 한다.
    expect(select).toHaveValue('2')

    const valuesObservedDuringOptionSwap: string[] = []
    const observer = new MutationObserver(() => {
      valuesObservedDuringOptionSwap.push(select.value)
    })
    observer.observe(select, { childList: true })

    await screen.findByText('개발본부 (002)')
    observer.disconnect()

    // 폴백 옵션이 실제 후보 옵션으로 교체되는 DOM 커밋 순간, 네이티브 select는 선택된 옵션 노드가
    // 제거된 것으로 인식해 selectedIndex를 0("최상위로 이동", value='')으로 되돌린다.
    expect(valuesObservedDuringOptionSwap).toContain('')

    // (참고) 이후 isSuccess 전이를 감지한 reset useEffect가 다시 실행되어 최종적으로는 올바른
    // 값으로 복구되지만, 이는 effect 스케줄링 타이밍에 의존하는 사후 땜질이라 근본 해결이 아니다.
    expect(select).toHaveValue('2')
  })

  it('현재 상위 부서가 후보 목록(활성/size100/자기제외)에 없으면 별도 옵션으로 주입해 select가 현재 값을 표시한다', async () => {
    // 후보 목록에 현재 상위 부서(deptId=99)가 전혀 없는 상황(비활성이거나 100건 범위 밖).
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')])),
      ),
    )

    renderDialog(99)

    await waitFor(() => expect(screen.getByText(/현재 상위 부서\(ID: 99/)).toBeInTheDocument())
    expect(screen.getByRole('combobox')).toHaveValue('99')
  })

  it('자기 자신(deptId)은 후보 목록에서 제외된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/departments`, () =>
        HttpResponse.json(candidatesPage([deptSummary(1, '본사(자기자신)'), deptSummary(2, '개발본부')])),
      ),
    )

    renderDialog(null)

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
    renderDialog(2)

    await screen.findByText('개발본부 (002)')
    await user.selectOptions(screen.getByRole('combobox'), '최상위로 이동')
    await user.click(screen.getByRole('button', { name: '변경' }))

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

    renderDialog(null)

    expect(
      await screen.findByText('후보 목록을 불러오지 못했습니다. 선택지가 불완전할 수 있습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '최상위로 이동' })).toBeInTheDocument()
  })
})

describe('UpdateDepartmentParentDialog - 닫힘 가드/실패 비삼킴', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('제출 중에는 취소 버튼/Esc로 닫을 수 없고, 응답 도착 후 닫힌다(성공)', async () => {
    let resolveResponse: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      resolveResponse = resolve
    })
    server.use(
      http.get(`${BASE_URL}/api/departments`, () => HttpResponse.json(candidatesPage([deptSummary(2, '개발본부')]))),
      http.patch(`${BASE_URL}/api/departments/1/parent`, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog(null)

    await screen.findByText('개발본부 (002)')
    await user.selectOptions(screen.getByRole('combobox'), '2')
    await user.click(screen.getByRole('button', { name: '변경' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '취소' })).toBeDisabled())
    await user.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    resolveResponse?.()

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const { toast } = await import('sonner')
    expect(toast.success).toHaveBeenCalledWith('상위 부서를 변경했습니다')
  })

  it('서버 실패 시 다이얼로그가 닫히지 않고 root 에러가 표시된다(실패가 삼켜지지 않음)', async () => {
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
    const { onOpenChange } = renderDialog(null)

    await screen.findByText('개발본부 (002)')
    await user.selectOptions(screen.getByRole('combobox'), '2')
    await user.click(screen.getByRole('button', { name: '변경' }))

    expect(await screen.findByText('순환 참조가 발생합니다')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
