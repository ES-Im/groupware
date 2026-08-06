import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getFranchiseEducationDetail } from './getFranchiseEducationDetail'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getFranchiseEducationDetail', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('/api/franchise-educations/{educationId}를 GET한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        id: 1,
        date: '2026-05-01',
        startAt: '10:00:00',
        place: '본사 3층 강당',
        title: '신규 가맹점 오리엔테이션',
        content: '가맹 운영 기본 교육입니다',
        appliedCount: 0,
        capacity: 20,
        remainingCapacity: 20,
        isActive: true,
        fileListInfoList: null,
      },
    })

    await getFranchiseEducationDetail(1)

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/franchise-educations/1')
  })

  it('fileListInfoList가 null인 응답을 가공 없이 그대로 반환한다', async () => {
    const detail = {
      id: 1,
      date: '2026-05-01',
      startAt: '10:00:00',
      place: '본사 3층 강당',
      title: '신규 가맹점 오리엔테이션',
      content: '가맹 운영 기본 교육입니다',
      appliedCount: 0,
      capacity: 20,
      remainingCapacity: 20,
      isActive: true,
      fileListInfoList: null,
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: detail })

    const result = await getFranchiseEducationDetail(1)

    expect(result).toEqual(detail)
    expect(result.fileListInfoList).toBeNull()
  })

  it('fileListInfoList가 배열인 응답도 가공 없이 그대로 반환한다', async () => {
    const detail = {
      id: 2,
      date: '2026-05-02',
      startAt: '14:00:00',
      place: '본사 3층 강당',
      title: '위생 교육',
      content: '위생 관리 기본 교육입니다',
      appliedCount: 3,
      capacity: 30,
      remainingCapacity: 27,
      isActive: false,
      fileListInfoList: [
        { fileId: 1, originalName: '위생교육자료.pdf', extension: 'pdf', fileSize: 1024 },
      ],
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: detail })

    const result = await getFranchiseEducationDetail(2)

    expect(result).toEqual(detail)
    expect(result.fileListInfoList).toHaveLength(1)
  })

  it('404 등 서버 판정 실패는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('request failed'))

    await expect(getFranchiseEducationDetail(999)).rejects.toThrow('request failed')
  })
})
