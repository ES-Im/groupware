import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createFranchise } from './createFranchise'

/**
 * createFranchise(FRANCHISE_CREATE, ROADMAP(FRANCHISE) T2.2, F1603) 단위 테스트.
 * createMeetingRoom.test.ts와 동일 패턴 — apiClient.post 직접 모킹으로 요청 URL/바디,
 * 응답 파싱(201 {franchiseId})을 검증한다.
 *
 * 핵심 계약:
 * - 요청 키는 franchiseName(목록/상세 응답의 name과 다름 — request-fields.adoc 실측).
 * - managerEmpId는 선택 필드로, 미지정(undefined) 시 body 키 자체를 생략한다.
 * - 응답 식별자 키는 franchiseId(목록/상세의 id와 다름 — response-fields.adoc 실측).
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

/** managerEmpId 없는 필수 6필드 payload 기준값. */
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
    vi.mocked(apiClient.post).mockResolvedValue({ data: { franchiseId: 55 } })
  })

  it('/api/franchises로 POST하고 응답의 franchiseId를 반환한다', async () => {
    const result = await createFranchise({ ...basePayload, managerEmpId: 7 })

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/franchises')
    expect(result).toEqual({ franchiseId: 55 })
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
