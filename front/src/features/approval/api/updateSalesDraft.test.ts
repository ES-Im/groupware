import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { updateSalesDraft, type SalesDraftUpdatePayload } from './updateSalesDraft'

vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn() },
}))

function payload(overrides: Partial<SalesDraftUpdatePayload> = {}): SalesDraftUpdatePayload {
  return {
    param: { title: '7월 매출 보고(수정)', content: '7월 매출을 정정 보고합니다', approvers: [] },
    franchiseId: 1,
    reportMonth: '2026-07',
    salesAmount: 1200000,
    ...overrides,
  }
}

describe('updateSalesDraft', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
    vi.mocked(apiClient.patch).mockResolvedValue({ data: undefined })
  })

  it('draftId path param을 그대로 사용한 URL(/api/drafts/sales/{draftId})로 PATCH 요청한다', async () => {
    await updateSalesDraft(42, payload())

    expect(apiClient.patch).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(url).toBe('/api/drafts/sales/42')
  })

  it('body는 혼합 구조를 그대로 유지한다(평탄화 금지) — title/content/approvers는 param 안, franchiseId/reportMonth/salesAmount는 최상위 형제', async () => {
    const body = payload({
      param: {
        title: '7월 매출 보고(수정)',
        content: '7월 매출을 정정 보고합니다',
        approvers: [{ approverId: 10, role: 'APPROVER', order: 1 }],
      },
    })

    await updateSalesDraft(1, body)

    const [, sentBody] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(sentBody).toEqual({
      param: {
        title: '7월 매출 보고(수정)',
        content: '7월 매출을 정정 보고합니다',
        approvers: [{ approverId: 10, role: 'APPROVER', order: 1 }],
      },
      franchiseId: 1,
      reportMonth: '2026-07',
      salesAmount: 1200000,
    })
    expect(sentBody).not.toHaveProperty('title')
    expect(sentBody).not.toHaveProperty('content')
  })

  it('부분 payload(전부 optional)는 넘긴 필드만 그대로 전달된다', async () => {
    await updateSalesDraft(1, { salesAmount: 900000 })

    const [, sentBody] = vi.mocked(apiClient.patch).mock.calls[0]
    expect(sentBody).toEqual({ salesAmount: 900000 })
    expect(sentBody).not.toHaveProperty('param')
    expect(sentBody).not.toHaveProperty('franchiseId')
    expect(sentBody).not.toHaveProperty('reportMonth')
  })

  it('204 Empty 응답이므로 반환값이 없다(void)', async () => {
    const result = await updateSalesDraft(1, payload())

    expect(result).toBeUndefined()
  })
})
