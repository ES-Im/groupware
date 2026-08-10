import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createFranchise } from './createFranchise'

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

const basePayload = {
  businessNumber: '123-45-67890',
  franchiseName: 'HARUON 강남점',
  address: '서울특별시 강남구 테헤란로 1',
  ownerName: '홍길동',
  contactNumber: '02-1234-5678',
  contactEmail: 'gangnam@haruon.com',
}

describe('createFranchise', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 55 } })
  })

  it('/api/franchises로 POST하고 응답의 id를 반환한다', async () => {
    const result = await createFranchise({ ...basePayload, managerEmpId: 7 })

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/franchises')
    expect(result).toEqual({ id: 55 })
  })

  it('managerEmpId를 지정하면 body에 그대로 포함된다', async () => {
    await createFranchise({ ...basePayload, managerEmpId: 7 })

    const [, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(body).toEqual({ ...basePayload, managerEmpId: 7 })
  })

  it('managerEmpId가 undefined면 body에서 키 자체가 생략된다', async () => {
    await createFranchise({ ...basePayload, managerEmpId: undefined })

    const [, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(body).not.toHaveProperty('managerEmpId')
    expect(body).toEqual(basePayload)
  })

  it('managerEmpId 필드 없이 호출해도 body에서 키가 생략된다', async () => {
    await createFranchise(basePayload)

    const [, body] = vi.mocked(apiClient.post).mock.calls[0]
    expect(body).not.toHaveProperty('managerEmpId')
    expect(body).toEqual(basePayload)
  })

  it('서버 판정 실패(이메일 중복 등)는 삼켜지지 않고 그대로 throw된다', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('request failed'))

    await expect(createFranchise(basePayload)).rejects.toThrow('request failed')
  })
})
