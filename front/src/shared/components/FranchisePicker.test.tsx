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

    expect(await screen.findByRole('button', { name: '테스트강남점 선택 해제' })).toBeInTheDocument()

    await user.click(row)

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
