import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { removeScheduleParticipants } from './removeScheduleParticipants'

/**
 * removeScheduleParticipants(F006, ROADMAP(SCHEDULE) T5.1) 단위 테스트.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { patch: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('removeScheduleParticipants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scope 없이 호출하면 participantIds 본문으로 PATCH를 호출한다', async () => {
    await removeScheduleParticipants(10, [3, 2])

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/schedules/10/participants',
      { participantIds: [3, 2] },
      { params: { scope: undefined } },
    )
  })

  it('scope=SERIES로 호출하면 해당 쿼리를 포함해 PATCH를 호출한다', async () => {
    await removeScheduleParticipants(10, [3], 'SERIES')

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/schedules/10/participants',
      { participantIds: [3] },
      { params: { scope: 'SERIES' } },
    )
  })

  it('participantIds가 빈 배열이면 요청 전 에러를 던진다', async () => {
    await expect(removeScheduleParticipants(10, [])).rejects.toThrow()
    expect(apiClient.patch).not.toHaveBeenCalled()
  })

  it('participantIds에 null 요소가 있으면 요청 전 에러를 던진다', async () => {
    await expect(removeScheduleParticipants(10, [1, null as unknown as number])).rejects.toThrow()
    expect(apiClient.patch).not.toHaveBeenCalled()
  })
})
