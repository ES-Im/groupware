import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getFranchiseAssignableManagers } from './getFranchiseAssignableManagers'

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
