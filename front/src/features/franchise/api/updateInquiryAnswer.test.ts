import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateInquiryAnswer } from './updateInquiryAnswer'

/**
 * updateInquiryAnswer(FRANCHISE_INQUIRY_ANSWER_UPDATE, ROADMAP(FRANCHISE) T5.4, F1622) 단위 테스트.
 * createInquiryAnswer.test.ts와 동형 구조 — apiClient.patch 직접 모킹으로 요청 URL/바디를 검증한다.
 *
 * 핵심 계약:
 * - PATCH /api/franchise-inquiries/{inquiryId}/answers
 * - body는 생성과 동일하게 {answer} 단일 필드.
 * - 미제출 상태에서만 허용되지만 그 판정은 서버가 담당하므로(사전 필터링 발명 금지) 이 함수
 *   자체는 무조건 요청을 보낸다. 성공 시 204(반환값 없음).
 */

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
