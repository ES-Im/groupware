import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '@/test/mocks/server'
import { apiClient, BASE_URL } from './client'
import { clearAccessToken, setAccessToken } from './tokenStore'

const PREVIEW_URL = `${BASE_URL}/api/employees/1/files/10/preview`
const REISSUE_URL = `${BASE_URL}/api/auth/reissue`

afterEach(() => {
  clearAccessToken()
})

describe('apiClient 응답 인터셉터 — blob 요청의 ROLE_002 재발급', () => {
  it('blob 응답으로 온 401 ROLE_002 에러 바디를 파싱해 재발급 후 원요청(blob)을 재시도해 성공한다', async () => {
    setAccessToken('expired-token')

    let previewCallCount = 0
    server.use(
      http.get(PREVIEW_URL, ({ request }) => {
        previewCallCount += 1
        if (previewCallCount === 1) {
          expect(request.headers.get('authorization')).toBe('Bearer expired-token')
          return HttpResponse.json(
            { code: 'ROLE_002', name: 'PERMISSION_DENIED_EXCEPTION', httpStatus: 401, message: '토큰이 유효하지 않습니다' },
            { status: 401 },
          )
        }
        expect(request.headers.get('authorization')).toBe('Bearer new-access-token')
        return HttpResponse.arrayBuffer(new TextEncoder().encode('image-bytes').buffer, {
          headers: { 'Content-Type': 'image/png' },
        })
      }),
      http.post(REISSUE_URL, () => HttpResponse.json({ accessToken: 'new-access-token' })),
    )

    const res = await apiClient.get(`/api/employees/1/files/10/preview`, { responseType: 'blob' })

    expect(previewCallCount).toBe(2)
    expect(res.status).toBe(200)
    expect(res.data).toBeInstanceOf(Blob)
    expect((res.data as Blob).size).toBeGreaterThan(0)
  })

  it('blob 응답의 401 에러 바디가 ROLE_002가 아니면(JSON 파싱 가능하되 다른 코드) 재발급 없이 그대로 reject한다', async () => {
    setAccessToken('some-token')

    server.use(
      http.get(PREVIEW_URL, () =>
        HttpResponse.json(
          { code: 'ROLE_003', name: 'FORBIDDEN', httpStatus: 401, message: '권한이 없습니다' },
          { status: 401 },
        ),
      ),
    )

    await expect(
      apiClient.get(`/api/employees/1/files/10/preview`, { responseType: 'blob' }),
    ).rejects.toMatchObject({ response: { status: 401 } })
  })

  it('blob 응답의 에러 바디가 JSON이 아니어도(파싱 실패) 재발급 없이 안전하게 reject한다', async () => {
    setAccessToken('some-token')

    server.use(
      http.get(PREVIEW_URL, () => new HttpResponse('not-json-binary-garbage', { status: 401 })),
    )

    await expect(
      apiClient.get(`/api/employees/1/files/10/preview`, { responseType: 'blob' }),
    ).rejects.toMatchObject({ response: { status: 401 } })
  })
})
