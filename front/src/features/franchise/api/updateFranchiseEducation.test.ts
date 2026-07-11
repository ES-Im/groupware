import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateFranchiseEducation } from './updateFranchiseEducation'

/**
 * updateFranchiseEducation(FRANCHISE_EDUCATION_UPDATE, ROADMAP(FRANCHISE) T4.4, F1613) 단위 테스트.
 * apiClient.patch를 직접 모킹해 요청 URL/바디, 204 무응답 처리를 검증한다.
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

describe('updateFranchiseEducation', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('/api/franchise-educations/{educationId}로 PATCH하고 payload를 그대로 전달한다', async () => {
    const payload = { title: '수정된 제목' }

    await updateFranchiseEducation(1, payload)

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/franchise-educations/1')
    expect(body).toEqual(payload)
  })

  it('빈 payload({})도 그대로 전달한다', async () => {
    await updateFranchiseEducation(1, {})

    const [, body] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(body).toEqual({})
  })

  it('204 No Content 응답이면 반환값이 없다(void)', async () => {
    const result = await updateFranchiseEducation(1, { capacity: 30 })

    expect(result).toBeUndefined()
  })

  it('서버 판정 실패(등록자 아님/신청자 존재 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('request failed'))

    await expect(updateFranchiseEducation(1, { title: '수정' })).rejects.toThrow('request failed')
  })
})
