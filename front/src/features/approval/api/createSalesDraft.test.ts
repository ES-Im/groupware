import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createSalesDraft, type SalesDraftPayload } from './createSalesDraft'

/**
 * createSalesDraft(F760 `SALES_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(SALES) T2.2) 단위 테스트.
 *
 * apiClient.post를 직접 모킹해 axios 호출 인자(URL, 바디)만 검증한다
 * (createLeaveDraft.test.ts와 동일 패턴).
 *
 * 핵심 검증 축:
 *   - submit=false → POST /api/drafts/sales / submit=true → POST /api/drafts/sales/submission.
 *   - body는 혼합 구조(title/content/approvers는 param 중첩, franchiseId/reportMonth/salesAmount는
 *     최상위 형제) — 평탄화되지 않고 그대로 전달되는지.
 *   - 응답 {draftId}가 그대로 반환되는지.
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

function payload(overrides: Partial<SalesDraftPayload> = {}): SalesDraftPayload {
  return {
    param: { title: '7월 매출 보고', content: '7월 매출 실적을 보고합니다' },
    franchiseId: 1,
    reportMonth: '2026-07',
    salesAmount: 10000000,
    ...overrides,
  }
}

describe('createSalesDraft', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.post).mockResolvedValue({ data: { draftId: 123 } })
  })

  it('submit=false면 POST /api/drafts/sales를 호출한다', async () => {
    await createSalesDraft(payload(), false)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/drafts/sales')
  })

  it('submit=true면 POST /api/drafts/sales/submission을 호출한다', async () => {
    await createSalesDraft(payload(), true)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/drafts/sales/submission')
  })

  it('body는 param 중첩 구조를 그대로 유지한다(평탄화 금지) — title/content/approvers는 param 안, franchiseId/reportMonth/salesAmount는 최상위 형제', async () => {
    const body = payload({
      param: {
        title: '7월 매출 보고',
        content: '7월 매출 실적을 보고합니다',
        approvers: [{ approverId: 10, role: 'APPROVER', order: 1 }],
      },
    })

    await createSalesDraft(body, true)

    const [, sentBody] = vi.mocked(apiClient.post).mock.calls[0]
    expect(sentBody).toEqual({
      param: {
        title: '7월 매출 보고',
        content: '7월 매출 실적을 보고합니다',
        approvers: [{ approverId: 10, role: 'APPROVER', order: 1 }],
      },
      franchiseId: 1,
      reportMonth: '2026-07',
      salesAmount: 10000000,
    })
    // 평탄화되어 title/content가 최상위로 올라와 있지 않은지 명시적으로 확인.
    expect(sentBody).not.toHaveProperty('title')
    expect(sentBody).not.toHaveProperty('content')
  })

  it('approvers를 지정하지 않으면 body의 param.approvers는 undefined인 채로 전달된다(임시저장, 결재선 없이 허용)', async () => {
    await createSalesDraft(payload(), false)

    const [, sentBody] = vi.mocked(apiClient.post).mock.calls[0] as [string, SalesDraftPayload]
    expect(sentBody.param.approvers).toBeUndefined()
  })

  it('응답 {draftId}를 그대로 반환한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { draftId: 999 } })

    const result = await createSalesDraft(payload(), true)

    expect(result).toEqual({ draftId: 999 })
  })
})
