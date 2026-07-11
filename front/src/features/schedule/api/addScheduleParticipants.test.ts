import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { addScheduleParticipants } from './addScheduleParticipants'

/**
 * addScheduleParticipants(F005, ROADMAP(SCHEDULE) T5.1) 단위 테스트.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { post: vi.fn().mockResolvedValue({ data: undefined }) },
}))

describe('addScheduleParticipants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scope 없이 호출하면 participantIds 본문으로 POST를 호출한다', async () => {
    await addScheduleParticipants(10, [3, 2])

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/schedules/10/participants',
      { participantIds: [3, 2] },
      { params: { scope: undefined } },
    )
  })

  it('scope=SERIES로 호출하면 해당 쿼리를 포함해 POST를 호출한다', async () => {
    await addScheduleParticipants(10, [3], 'SERIES')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/schedules/10/participants',
      { participantIds: [3] },
      { params: { scope: 'SERIES' } },
    )
  })

  it('participantIds가 빈 배열이면 요청 전 에러를 던진다', async () => {
    await expect(addScheduleParticipants(10, [])).rejects.toThrow()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('participantIds에 null 요소가 있으면 요청 전 에러를 던진다', async () => {
    await expect(addScheduleParticipants(10, [1, null as unknown as number])).rejects.toThrow()
    expect(apiClient.post).not.toHaveBeenCalled()
  })
})
