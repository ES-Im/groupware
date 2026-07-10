import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getCompanyInfo } from './getCompanyInfo'

/**
 * getCompanyInfo(COMPANY_INFO, ROADMAP-COMPANY T1.1) 단위 테스트.
 *
 * apiClient.get을 직접 모킹해 이 도메인 특유의 "404=미등록 정상 상태" 정규화를 검증한다
 * (getFranchises.test.ts와 동일 패턴 — apiClient 모킹, MSW 미사용).
 *
 * axios.isAxiosError가 인식하는 최소 형태(isAxiosError 플래그 + response)만 흉내낸 가짜 에러
 * (CommentForm.test.tsx/LoginForm.test.tsx와 동일 패턴).
 */
function fakeAxiosError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { code, name: code, httpStatus: status, message } },
  })
}

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getCompanyInfo', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('200 응답이면 GET /api/companies를 호출하고 응답 데이터를 그대로 반환한다', async () => {
    const data = {
      companyId: 1,
      companyName: 'HARUON',
      location: '서울특별시 강남구',
      presentedEmail: 'contact@haruon.com',
      presentedExternalNo: '02-1234-5678',
      ownerName: '김대표',
      homePageURL: 'https://haruon.com',
      editedAt: '2026-07-01T10:00:00',
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data })

    const result = await getCompanyInfo()

    expect(apiClient.get).toHaveBeenCalledWith('/api/companies')
    expect(result).toEqual(data)
  })

  it('404(미등록)이면 throw하지 않고 null을 반환한다', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(
      fakeAxiosError(404, 'COMPANY_NOT_FOUND', '등록된 회사 정보가 없습니다'),
    )

    const result = await getCompanyInfo()

    expect(result).toBeNull()
  })

  it('404가 아닌 실패(500)는 그대로 throw한다', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(
      fakeAxiosError(500, 'COMMON_001', '서버 오류'),
    )

    await expect(getCompanyInfo()).rejects.toThrow()
  })
})
