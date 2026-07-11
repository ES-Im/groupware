import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { sendInquiryAnswer } from './sendInquiryAnswer'

/**
 * sendInquiryAnswer(FRANCHISE_INQUIRY_ANSWER_SEND, ROADMAP(FRANCHISE) T5.4, F1623) 단위 테스트.
 * assignInquiryAnswerManager.test.ts와 동형 구조(Path only, 본문 없음) — apiClient.patch
 * 직접 모킹으로 요청 URL과 본문 미포함을 검증한다.
 *
 * 핵심 계약:
 * - PATCH /api/franchise-inquiries/{inquiryId}/answers/send
 * - Path only(쿼리 파라미터·본문 없음). 성공 시 204(반환값 없음).
 * - 발송 후 수정 불가 판정은 서버가 최종 담당한다(사전 필터링 발명 금지).
 */

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
