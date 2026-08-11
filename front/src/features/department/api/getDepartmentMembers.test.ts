import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { getDepartmentMembers } from './getDepartmentMembers'

function emptyPage() {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  }
}

function captureParams() {
  const captured: { params?: URLSearchParams } = {}
  server.use(
    http.get(`${BASE_URL}/api/departments/1/members`, ({ request }) => {
      captured.params = new URL(request.url).searchParams
      return HttpResponse.json(emptyPage())
    }),
  )
  return captured
}

describe('getDepartmentMembers', () => {
  it('isEmpActive를 지정하지 않으면 쿼리스트링에 실리지 않는다', async () => {
    const captured = captureParams()

    await getDepartmentMembers(1, { page: 0, size: 10 })

    expect(captured.params?.has('isEmpActive')).toBe(false)
  })

  it('isEmpActive: true를 지정하면 활성 사원 필터가 쿼리스트링에 실린다', async () => {
    const captured = captureParams()

    await getDepartmentMembers(1, { isEmpActive: true, size: 50 })

    expect(captured.params?.get('isEmpActive')).toBe('true')
    expect(captured.params?.get('size')).toBe('50')
  })

  it('isEmpActive: false도 명시하면 그대로 전달한다', async () => {
    const captured = captureParams()

    await getDepartmentMembers(1, { isEmpActive: false })

    expect(captured.params?.get('isEmpActive')).toBe('false')
  })
})
