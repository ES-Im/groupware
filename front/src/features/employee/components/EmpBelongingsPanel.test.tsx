import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { EmpBelongingsPanel } from './EmpBelongingsPanel'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function renderPanel(empId: number | undefined) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmpBelongingsPanel empId={empId} />
    </QueryClientProvider>,
  )
}

describe('EmpBelongingsPanel - 로딩/빈 상태', () => {
  it('조회 중에는 "불러오는 중..."이 노출된다', async () => {
    const belongingsDeferred = deferred<Response>()
    server.use(http.get(`${BASE_URL}/api/employees/1/belongings`, () => belongingsDeferred.promise))

    renderPanel(1)

    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument()

    belongingsDeferred.resolve(HttpResponse.json([]))
  })

  it('목록이 빈 배열이면 "소속 이력이 없습니다."가 노출된다', async () => {
    server.use(http.get(`${BASE_URL}/api/employees/1/belongings`, () => HttpResponse.json([])))

    renderPanel(1)

    expect(await screen.findByText('소속 이력이 없습니다.')).toBeInTheDocument()
  })
})

describe('EmpBelongingsPanel - 목록 렌더', () => {
  it('종료된 이력을 포함해 최신순으로 렌더한다', async () => {
    server.use(
      http.get(`${BASE_URL}/api/employees/1/belongings`, () =>
        HttpResponse.json([
          { deptId: 1, deptCode: 'D1', deptName: '개발팀', positionName: '팀장', isPrimary: true, startAt: '2025-01-01', endAt: null },
          { deptId: 2, deptCode: 'D2', deptName: '기획팀', positionName: '사원', isPrimary: false, startAt: '2023-01-01', endAt: '2024-12-31' },
        ]),
      ),
    )

    renderPanel(1)

    const items = await screen.findAllByRole('listitem')
    expect(items[0]).toHaveTextContent('개발팀')
    expect(items[0]).toHaveTextContent('현재 재직 중')
    expect(items[1]).toHaveTextContent('기획팀')
    expect(items[1]).toHaveTextContent('2024-12-31')
  })
})
