import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { apiClient, BASE_URL } from '@/shared/api/client'
import { server } from './mocks/server'

describe('테스트 하네스', () => {
  it('jsdom + RTL: 컴포넌트를 렌더하고 DOM 단언을 쓸 수 있다', () => {
    render(<h1>HARUON</h1>)
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
