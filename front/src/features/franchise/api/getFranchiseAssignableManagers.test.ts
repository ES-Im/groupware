import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getFranchiseAssignableManagers } from './getFranchiseAssignableManagers'

/**
 * getFranchiseAssignableManagers(FRANCHISE_ASSIGNABLE_MANAGERS) 단위 테스트.
 * apiClient.get을 직접 모킹해 호출 URL과 반환값(응답 배열 무가공 반환)을 검증한다(getFranchises.test 동형).
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: [] }) },
}))

describe('getFranchiseAssignableManagers', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('/api/franchises/assignable-managers를 호출하고 응답 배열을 그대로 반환한다', async () => {
    const managers = [
      { empId: 1, empName: '김담당' },
      { empId: 2, empName: '이담당' },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: managers })

    const result = await getFranchiseAssignableManagers()

    expect(apiClient.get).toHaveBeenCalledWith('/api/franchises/assignable-managers')
    expect(result).toEqual(managers)
  })
})
