import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { activateFranchiseEducation, deactivateFranchiseEducation } from './toggleFranchiseEducationActive'

/**
 * activateFranchiseEducation/deactivateFranchiseEducation(FRANCHISE_EDUCATION_ACTIVATE/_DEACTIVATE,
 * ROADMAP(FRANCHISE) T4.4, F1614) 단위 테스트.
 *
 * ⚠️ 핵심 계약: 회의실 토글 선례(PATCH)와 달리 이 두 엔드포인트는 **POST**다
 * (스니펫 실측 — apiClient.post 호출 검증이 이 테스트의 핵심).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

describe('activateFranchiseEducation', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined })
  })

  it('/api/franchise-educations/{educationId}/activation으로 POST한다(본문 없음)', async () => {
    await activateFranchiseEducation(1)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/franchise-educations/1/activation')
    expect(body).toBeUndefined()
  })

  it('서버 판정 실패는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('request failed'))

    await expect(activateFranchiseEducation(1)).rejects.toThrow('request failed')
  })
})

describe('deactivateFranchiseEducation', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined })
  })

  it('/api/franchise-educations/{educationId}/deactivation으로 POST한다(본문 없음)', async () => {
    await deactivateFranchiseEducation(1)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/franchise-educations/1/deactivation')
    expect(body).toBeUndefined()
  })

  it('서버 판정 실패는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('request failed'))

    await expect(deactivateFranchiseEducation(1)).rejects.toThrow('request failed')
  })
})
