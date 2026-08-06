import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { BASE_URL } from '@/shared/api/client'
import { server } from '@/test/mocks/server'
import { getNewEmployees } from './getNewEmployees'

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

describe('getNewEmployees', () => {
  it('params 없이 호출하면 쿼리스트링이 비어있다', async () => {
    let capturedSearch = ''
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, ({ request }) => {
        capturedSearch = new URL(request.url).search
        return HttpResponse.json(emptyPage())
      }),
    )

    await getNewEmployees()

    expect(capturedSearch).toBe('')
  })

  it('keyword만 지정하면 keyword만 쿼리스트링에 실리고 page/size는 생략된다', async () => {
    let capturedParams: URLSearchParams | undefined
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json(emptyPage())
      }),
    )

    await getNewEmployees({ keyword: '홍길동' })

    expect(capturedParams?.get('keyword')).toBe('홍길동')
    expect(capturedParams?.has('page')).toBe(false)
    expect(capturedParams?.has('size')).toBe(false)
  })

  it('keyword/page/size를 모두 지정하면 전부 쿼리스트링에 실린다', async () => {
    let capturedParams: URLSearchParams | undefined
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, ({ request }) => {
        capturedParams = new URL(request.url).searchParams
        return HttpResponse.json(emptyPage())
      }),
    )

    await getNewEmployees({ keyword: '홍길동', page: 1, size: 20 })

    expect(capturedParams?.get('keyword')).toBe('홍길동')
    expect(capturedParams?.get('page')).toBe('1')
    expect(capturedParams?.get('size')).toBe('20')
  })

  it('응답 Page를 그대로 반환한다', async () => {
    const record = {
      empId: 9,
      empNo: '202607009',
      name: '홍길동',
      loginId: 'hong09',
      email: 'hong09@haruon.com',
      extensionNo: '',
    }
    server.use(
      http.get(`${BASE_URL}/api/employees/new`, () =>
        HttpResponse.json({ ...emptyPage(), content: [record], totalElements: 1 }),
      ),
    )

    const result = await getNewEmployees()

    expect(result.content).toEqual([record])
    expect(result.totalElements).toBe(1)
  })
})
