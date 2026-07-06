import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { server } from '@/test/mocks/server'
import { apiClient, BASE_URL } from './client'
import { clearAccessToken, setAccessToken } from './tokenStore'

/**
 * client.ts 응답 인터셉터(T0.1) 재발급 경로 검증 — 특히 ROADMAP T5.1 리뷰에서 지적된
 * "responseType:'blob' 요청이 401 ROLE_002를 만나도 재발급을 타지 못하는" 문제의 보완분.
 * blob 에러 바디도 code를 정상 추출해 기존 재발급→원요청 재시도 경로를 그대로 태우는지 확인한다.
 */

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
          // 실제 EMP_FILE_PREVIEW처럼 responseType:'blob' 요청이라도 에러 바디는 JSON 계약 그대로 온다.
          expect(request.headers.get('authorization')).toBe('Bearer expired-token')
          return HttpResponse.json(
            { code: 'ROLE_002', name: 'PERMISSION_DENIED_EXCEPTION', httpStatus: 401, message: '토큰이 유효하지 않습니다' },
            { status: 401 },
          )
        }
        // 재시도 요청은 갱신된 토큰을 실어야 한다.
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
    // 재시도 요청도 responseType:'blob'이 그대로 유지된 원요청 config로 나갔음을 데이터 형태로 확인.
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
