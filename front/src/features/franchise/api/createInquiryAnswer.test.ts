import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createInquiryAnswer } from './createInquiryAnswer'

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

describe('createInquiryAnswer', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined })
  })

  it('/api/franchise-inquiries/{inquiryId}/answers로 POST하고 body에 answer를 담아 전송한다', async () => {
    await createInquiryAnswer(1, '환불 처리하겠습니다')

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/1/answers')
    expect(body).toEqual({ answer: '환불 처리하겠습니다' })
  })

  it('다른 inquiryId도 그대로 경로에 반영된다', async () => {
    await createInquiryAnswer(42, '검토 후 회신드리겠습니다')

    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/42/answers')
    expect(body).toEqual({ answer: '검토 후 회신드리겠습니다' })
  })

  it('서버 판정 실패(권한 위반 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('request failed'))

    await expect(createInquiryAnswer(1, '답변')).rejects.toThrow('request failed')
  })
})
