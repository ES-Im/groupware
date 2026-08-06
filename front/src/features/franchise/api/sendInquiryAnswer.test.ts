import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { sendInquiryAnswer } from './sendInquiryAnswer'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

describe('sendInquiryAnswer', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('/api/franchise-inquiries/{inquiryId}/answers/send로 PATCH하고 본문 없이 호출한다', async () => {
    await sendInquiryAnswer(1)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/1/answers/send')
    expect(body).toBeUndefined()
  })

  it('다른 inquiryId도 그대로 경로에 반영된다', async () => {
    await sendInquiryAnswer(42)

    const [url] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/42/answers/send')
  })

  it('서버 판정 실패(이미 발송된 답변 재발송 시도 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(sendInquiryAnswer(1)).rejects.toThrow('request failed')
  })
})
