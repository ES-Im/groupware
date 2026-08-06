import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateInquiryAnswer } from './updateInquiryAnswer'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

describe('updateInquiryAnswer', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('/api/franchise-inquiries/{inquiryId}/answers로 PATCH하고 body에 answer를 담아 전송한다', async () => {
    await updateInquiryAnswer(1, '수정된 답변입니다')

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/1/answers')
    expect(body).toEqual({ answer: '수정된 답변입니다' })
  })

  it('다른 inquiryId도 그대로 경로에 반영된다', async () => {
    await updateInquiryAnswer(42, '재검토했습니다')

    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/franchise-inquiries/42/answers')
    expect(body).toEqual({ answer: '재검토했습니다' })
  })

  it('서버 판정 실패(이미 제출된 답변 수정 시도 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(updateInquiryAnswer(1, '답변')).rejects.toThrow('request failed')
  })
})
