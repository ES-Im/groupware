import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { getEmpsForManagement } from './getEmpsForManagement'

/**
 * getEmpsForManagement(EMPS_FOR_MANAGEMENT, GET /api/employees) 단위 테스트.
 * deptId/status/keyword/page/size는 query-parameters.adoc 실측대로 전부 선택값이라, 값이 없는
 * 파라미터는 쿼리스트링 자체에서 생략되는지 + 값이 있으면 그대로 실리는지를 검증한다.
 */

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

describe('getEmpsForManagement', () => {
  it('params 없이 호출하면 쿼리스트링이 비어있다', async () => {
    let capturedSearch = ''
    server.use(
      http.get(`${BASE_URL}/api/employees`, ({ request }) => {
        capturedSearch = new URL(request.url).search
        return HttpResponse.json(emptyPage())
      }),
    )

    await getEmpsForManagement()

    expect(capturedSearch).toBe('')
  })

  it('deptId/size만 지정하면 그 두 파라미터만 쿼리스트링에 실린다', async () => {
    let capturedParams: URLSearchParams | undefined
    server.use(
      http.get(`${BASE_URL}/api/employees`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json(emptyPage())
      }),
    )

    await getEmpsForManagement({ deptId: 3, size: 100 })

    expect(capturedParams?.get('deptId')).toBe('3')
    expect(capturedParams?.get('size')).toBe('100')
    expect(capturedParams?.has('status')).toBe(false)
    expect(capturedParams?.has('keyword')).toBe(false)
    expect(capturedParams?.has('page')).toBe(false)
  })

  it('status/keyword/page까지 전부 지정하면 모든 파라미터가 실린다', async () => {
    let capturedParams: URLSearchParams | undefined
    server.use(
      http.get(`${BASE_URL}/api/employees`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json(emptyPage())
      }),
    )

    await getEmpsForManagement({ deptId: 3, status: 'ACTIVE', keyword: '홍길동', page: 1, size: 20 })

    expect(capturedParams?.get('deptId')).toBe('3')
    expect(capturedParams?.get('status')).toBe('ACTIVE')
    expect(capturedParams?.get('keyword')).toBe('홍길동')
    expect(capturedParams?.get('page')).toBe('1')
    expect(capturedParams?.get('size')).toBe('20')
  })

  it('응답 Page를 그대로 반환한다', async () => {
    const record = {
      empId: 7,
      empNo: '202607007',
      empName: '홍길동',
      loginId: 'hong01',
      email: 'hong@haruon.com',
      extensionNo: '101-0001',
      status: 'ACTIVE',
      hireAt: '2024-01-01',
      resignAt: null,
      belongings: [],
      systemRoleCodeName: ['EMPLOYEE'],
    }
    server.use(
      http.get(`${BASE_URL}/api/employees`, () =>
        HttpResponse.json({ ...emptyPage(), content: [record], totalElements: 1 }),
      ),
    )

    const result = await getEmpsForManagement({ deptId: 1 })

    expect(result.content).toEqual([record])
    expect(result.totalElements).toBe(1)
  })
})
