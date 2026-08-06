import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { assignInquiryAnswerManager } from './assignInquiryAnswerManager'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

describe('assignInquiryAnswerManager', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('/api/franchise-inquiries/{inquiryId}/assign-answer로 PATCH하고 assignedEmpId를 쿼리 파라미터로 전송한다', async () => {
    await assignInquiryAnswerManager(1, 7)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body, config] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/1/assign-answer')
    expect(body).toBeNull()
    expect(config).toEqual({ params: { assignedEmpId: 7 } })
  })

  it('다른 inquiryId·assignedEmpId 조합도 그대로 경로/쿼리 파라미터에 반영된다', async () => {
    await assignInquiryAnswerManager(42, 99)

    const [url, , config] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/42/assign-answer')
    expect(config).toEqual({ params: { assignedEmpId: 99 } })
  })

  it('서버 판정 실패(도메인 위반 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(assignInquiryAnswerManager(1, 7)).rejects.toThrow('request failed')
  })
})
