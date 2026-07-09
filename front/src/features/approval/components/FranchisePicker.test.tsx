import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { FranchisePicker, type FranchisePickerSelection } from './FranchisePicker'

/**
 * FranchisePicker(F762, ROADMAP(SALES) T1.2) 실동작 검증.
 *
 * EmployeePicker(department 도메인 2단 탐색)를 단일 목록·단일 선택으로 치환 복제한 위젯이므로,
 * 검증 축도 EmployeePicker/DepartmentsPage의 기존 컨벤션(디바운스 검색, MSW server.use 목,
 * 실타이머 waitFor)을 그대로 따른다.
 *
 * - 마운트 시 useMeQuery의 empBasicInfo.empId를 managerId로 담당 가맹점 우선 조회.
 * - 검색어 입력(디바운스 300ms) 시 managerId 제거하고 keyword 전체 검색으로 전환.
 * - 행 클릭 단일 선택 / 재클릭 선택 해제(onChange(null)).
 * - 담당 가맹점 0건(검색어 없음) 빈 상태 안내.
 * - !last(다음 페이지 더 있음) 안내 문구.
 * - useMeQuery 로딩 중/empId 미확보 시 managerId 생략 fail-closed(전체 목록 노출).
 */

function franchise(id: number, name: string, managerEmpId: number) {
  return {
    id,
    name,
    address: '서울특별시 강남구',
    ownerName: '홍길동',
    BusinessStatus: '정상 영업 중',
    managerEmpId,
    managerEmpName: '김담당',
  }
}

function makePage(items: unknown[], overrides: Partial<{ last: boolean }> = {}) {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 50,
    first: true,
    last: overrides.last ?? true,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

function meFixture(empId: number) {
  return {
    empBasicInfo: {
      empId,
      empNo: '000000001',
      name: '홍길동',
      loginId: 'test1234',
      email: 'test1234@haruon.com',
      extensionNo: null,
    },
    activeFiles: [],
    currentDepts: [],
  }
}

function mockMe(empId: number) {
  server.use(http.get(`${BASE_URL}/api/employees/me`, () => HttpResponse.json(meFixture(empId))))
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function renderPicker(
  props: { selected?: FranchisePickerSelection | null; onChange?: (next: FranchisePickerSelection | null) => void } = {},
) {
  const Wrapper = createWrapper()
  return render(
    <Wrapper>
      <FranchisePicker selected={props.selected ?? null} onChange={props.onChange ?? (() => {})} />
    </Wrapper>,
  )
}

/** 제어형 계약(controlled) 그대로 소비하는 최소 하네스: 실제 선택→해제 왕복 동작을 검증한다. */
function ControlledHarness() {
  const [selected, setSelected] = useState<FranchisePickerSelection | null>(null)
  return <FranchisePicker selected={selected} onChange={setSelected} />
}

function renderControlledHarness() {
  const Wrapper = createWrapper()
  return render(
    <Wrapper>
      <ControlledHarness />
    </Wrapper>,
  )
}

describe('FranchisePicker - 담당 기본뷰(managerId)', () => {
  it('마운트 시 useMeQuery의 empId를 managerId로 넘겨 담당 가맹점을 우선 조회한다', async () => {
    mockMe(7)
    const requestedParams: URLSearchParams[] = []
    server.use(
      http.get(`${BASE_URL}/api/franchises`, ({ request }) => {
        const url = new URL(request.url)
        requestedParams.push(url.searchParams)
        return HttpResponse.json(makePage([franchise(1, '테스트강남점', 7)]))
      }),
    )

    renderPicker()

    await screen.findByText('테스트강남점')

    await waitFor(() => expect(requestedParams.length).toBeGreaterThan(0))
    const last = requestedParams[requestedParams.length - 1]
    expect(last.get('managerId')).toBe('7')
    expect(last.has('keyword')).toBe(false)
  })
})

describe('FranchisePicker - 검색 모드 전환', () => {
  it('검색어 입력(디바운스 300ms) 시 managerId를 제거하고 keyword 전체 검색으로 전환한다', async () => {
    mockMe(7)
    const requestedParams: URLSearchParams[] = []
    server.use(
      http.get(`${BASE_URL}/api/franchises`, ({ request }) => {
        const url = new URL(request.url)
        requestedParams.push(url.searchParams)
        const keyword = url.searchParams.get('keyword')
        if (keyword === '역삼') {
          return HttpResponse.json(makePage([franchise(2, '역삼점', 99)]))
        }
        return HttpResponse.json(makePage([franchise(1, '테스트강남점', 7)]))
      }),
    )

    const user = userEvent.setup()
    renderPicker()

    await screen.findByText('테스트강남점')

    await user.type(screen.getByLabelText('가맹점 검색'), '역삼')

    // 디바운스 유예 시간 전에는 아직 keyword='역삼' 파라미터가 반영된 요청이 없어야 한다.
    expect(requestedParams.every((p) => p.get('keyword') !== '역삼')).toBe(true)

    await screen.findByText('역삼점')

    const last = requestedParams[requestedParams.length - 1]
    expect(last.get('keyword')).toBe('역삼')
    expect(last.has('managerId')).toBe(false)
  })
})

describe('FranchisePicker - 단일 선택/해제', () => {
  it('행 클릭으로 단일 선택되고, 같은 행을 다시 클릭하면 선택 해제된다', async () => {
    mockMe(7)
    server.use(
      http.get(`${BASE_URL}/api/franchises`, () =>
        HttpResponse.json(makePage([franchise(1, '테스트강남점', 7)])),
      ),
    )

    const user = userEvent.setup()
    renderControlledHarness()

    await screen.findByText('테스트강남점')

    const list = screen.getByRole('list')
    const row = within(list).getByRole('button', { name: /테스트강남점/ })

    await user.click(row)

    // 선택되면 상단에 선택 칩(선택 해제 버튼)이 나타난다.
    expect(await screen.findByRole('button', { name: '테스트강남점 선택 해제' })).toBeInTheDocument()

    await user.click(row)

    // 같은 행을 다시 누르면 해제되어 선택 칩이 사라진다.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '테스트강남점 선택 해제' })).not.toBeInTheDocument(),
    )
  })
})

describe('FranchisePicker - 빈 상태 안내', () => {
  it('담당 가맹점 결과가 0건이면(검색어 없음) 빈 상태 안내 문구가 뜬다', async () => {
    mockMe(7)
    server.use(
      http.get(`${BASE_URL}/api/franchises`, () => HttpResponse.json(makePage([]))),
    )

    renderPicker()

    expect(
      await screen.findByText('담당 가맹점이 없습니다. 이름·주소로 검색해 선택하세요.'),
    ).toBeInTheDocument()
  })
})

describe('FranchisePicker - 결과 과다 안내', () => {
  it('!last(다음 페이지가 더 있음)일 때 검색 유도 안내 문구가 뜬다', async () => {
    mockMe(7)
    server.use(
      http.get(`${BASE_URL}/api/franchises`, () =>
        HttpResponse.json(makePage([franchise(1, '테스트강남점', 7)], { last: false })),
      ),
    )

    renderPicker()

    await screen.findByText('테스트강남점')
    expect(await screen.findByText('결과가 많습니다. 검색해 좁혀주세요.')).toBeInTheDocument()
  })
})

describe('FranchisePicker - useMeQuery 미확보 시 fail-closed', () => {
  it('useMeQuery가 아직 로딩 중이면 managerId 없이 조회되어 전체 목록이 노출된다', async () => {
    // 응답을 영원히 지연시켜 "아직 로딩 중"인 상태를 고정한다(usePrimaryDeptId.test.tsx와 동일 기법).
    server.use(http.get(`${BASE_URL}/api/employees/me`, () => new Promise(() => {})))
    const requestedParams: URLSearchParams[] = []
    server.use(
      http.get(`${BASE_URL}/api/franchises`, ({ request }) => {
        const url = new URL(request.url)
        requestedParams.push(url.searchParams)
        return HttpResponse.json(makePage([franchise(1, '테스트강남점', 1)]))
      }),
    )

    renderPicker()

    await screen.findByText('테스트강남점')
    expect(requestedParams.every((p) => !p.has('managerId'))).toBe(true)
  })

  it('useMeQuery 조회가 실패해 empId를 못 구하면 managerId 없이 조회되어 전체 목록이 노출된다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/me`, () =>
        HttpResponse.json(
          { code: 'UNKNOWN', name: 'UNKNOWN', httpStatus: 500, message: '서버 오류' },
          { status: 500 },
        ),
      ),
    )
    const requestedParams: URLSearchParams[] = []
    server.use(
      http.get(`${BASE_URL}/api/franchises`, ({ request }) => {
        const url = new URL(request.url)
        requestedParams.push(url.searchParams)
        return HttpResponse.json(makePage([franchise(1, '테스트강남점', 1)]))
      }),
    )

    renderPicker()

    await screen.findByText('테스트강남점')
    await waitFor(() => expect(requestedParams.length).toBeGreaterThan(0))
    expect(requestedParams.every((p) => !p.has('managerId'))).toBe(true)
  })
})
