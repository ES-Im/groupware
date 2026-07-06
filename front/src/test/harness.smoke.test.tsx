import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { apiClient, BASE_URL } from '@/shared/api/client'
import { server } from './mocks/server'

/**
 * 하네스 스모크 테스트.
 *
 * 이 파일은 특정 도메인 기능이 아니라 "테스트 하네스 자체"가 동작하는지 확인한다.
 * 여기가 통과하면 test-author-runner가 전제하는 환경(Vitest+RTL+MSW+jsdom+별칭)이 준비된 것이다.
 */
describe('테스트 하네스', () => {
  it('jsdom + RTL: 컴포넌트를 렌더하고 DOM 단언을 쓸 수 있다', () => {
    render(<h1>HARUON</h1>)
    // jest-dom 확장(toBeInTheDocument)이 로드됐는지까지 함께 검증한다.
    expect(screen.getByRole('heading', { name: 'HARUON' })).toBeInTheDocument()
  })

  it('MSW: apiClient(axios)의 실제 요청을 목으로 가로챈다 (@ 별칭 포함)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/__smoke`, () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    const res = await apiClient.get<{ ok: boolean }>('/api/__smoke')

    expect(res.status).toBe(200)
    expect(res.data).toEqual({ ok: true })
  })
})
