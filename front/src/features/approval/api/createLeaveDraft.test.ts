import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { createLeaveDraft, type LeaveDraftPayload } from './createLeaveDraft'

/**
 * createLeaveDraft(F740 `LEAVE_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(LEAVE) T1.2) 단위 테스트.
 *
 * apiClient.post를 직접 모킹해 axios 호출 인자(URL, 바디)만 검증한다
 * (checkIn.test.ts/updateAttendance.test.ts와 동일 패턴).
 *
 * 핵심 검증 축:
 *   - submit=false → POST /api/drafts/leaves / submit=true → POST /api/drafts/leaves/submission.
 *   - body는 혼합 구조(title/content/approvers는 param 중첩, startAt/endAt/leaveType은 최상위
 *     형제) — 평탄화되지 않고 그대로 전달되는지.
 *   - 응답 {draftId}가 그대로 반환되는지.
 */

vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn() },
}))

function payload(overrides: Partial<LeaveDraftPayload> = {}): LeaveDraftPayload {
  return {
    param: { title: '연차 신청', content: '개인 사정으로 연차를 신청합니다' },
    startAt: '2026-07-10T09:00:00',
    endAt: '2026-07-10T18:00:00',
    leaveType: 'ANNUAL',
    ...overrides,
  }
}

describe('createLeaveDraft', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.post).mockResolvedValue({ data: { draftId: 123 } })
  })

  it('submit=false면 POST /api/drafts/leaves를 호출한다', async () => {
    await createLeaveDraft(payload(), false)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/drafts/leaves')
  })

  it('submit=true면 POST /api/drafts/leaves/submission을 호출한다', async () => {
    await createLeaveDraft(payload(), true)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiClient.post).mock.calls[0]
    expect(url).toBe('/api/drafts/leaves/submission')
  })

  it('body는 param 중첩 구조를 그대로 유지한다(평탄화 금지) — title/content/approvers는 param 안, startAt/endAt/leaveType은 최상위 형제', async () => {
    const body = payload({
      param: {
        title: '연차 신청',
        content: '개인 사정으로 연차를 신청합니다',
        approvers: [{ approverId: 10, role: 'APPROVER', order: 1 }],
      },
    })

    await createLeaveDraft(body, true)

    const [, sentBody] = vi.mocked(apiClient.post).mock.calls[0]
    expect(sentBody).toEqual({
      param: {
        title: '연차 신청',
        content: '개인 사정으로 연차를 신청합니다',
        approvers: [{ approverId: 10, role: 'APPROVER', order: 1 }],
      },
      startAt: '2026-07-10T09:00:00',
      endAt: '2026-07-10T18:00:00',
      leaveType: 'ANNUAL',
    })
    // 평탄화되어 title/content가 최상위로 올라와 있지 않은지 명시적으로 확인.
    expect(sentBody).not.toHaveProperty('title')
    expect(sentBody).not.toHaveProperty('content')
  })

  it('approvers를 지정하지 않으면 body의 param.approvers는 undefined인 채로 전달된다(임시저장, 결재선 없이 허용)', async () => {
    await createLeaveDraft(payload(), false)

    const [, sentBody] = vi.mocked(apiClient.post).mock.calls[0] as [string, LeaveDraftPayload]
    expect(sentBody.param.approvers).toBeUndefined()
  })

  it('응답 {draftId}를 그대로 반환한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { draftId: 999 } })

    const result = await createLeaveDraft(payload(), true)

    expect(result).toEqual({ draftId: 999 })
  })
})
