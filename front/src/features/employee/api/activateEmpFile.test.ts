import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { activateEmpFile } from './activateEmpFile'

/**
 * activateEmpFile(ACTIVATE_ME_FILE) 단위 테스트.
 * 요청 본문이 JSON이 아니라 application/x-www-form-urlencoded(isForActivate)임을 검증한다
 * (http-request.adoc 실측).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('activateEmpFile', () => {
  it('PATCH /api/employees/me/files/{fileId}/status를 URLSearchParams(isForActivate=true)로 요청한다', async () => {
    await activateEmpFile(3, true)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/employees/me/files/3/status')
    expect(body).toBeInstanceOf(URLSearchParams)
    expect((body as URLSearchParams).get('isForActivate')).toBe('true')
  })

  it('isForActivate=false로 비활성화 요청도 보낼 수 있다', async () => {
    await activateEmpFile(3, false)

    const calls = vi.mocked(apiClient.patch).mock.calls
    const [, body] = calls[calls.length - 1]
    expect((body as URLSearchParams).get('isForActivate')).toBe('false')
  })
})
