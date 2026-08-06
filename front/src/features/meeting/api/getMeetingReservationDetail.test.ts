import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMeetingReservationDetail } from './getMeetingReservationDetail'

vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
}))

describe('getMeetingReservationDetail', () => {
  it('GET /api/meetings/{meetingId}를 호출한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: {} })

    await getMeetingReservationDetail(10)

    expect(apiClient.get).toHaveBeenCalledWith('/api/meetings/10')
  })

  it('응답을 그대로 반환한다', async () => {
    const detail = {
      meetingId: 10,
      meetingRoomId: 3,
      meetingRoomName: '대회의실',
      reserverId: 7,
      reserverDeptName: '개발팀',
      reserverEmpName: '홍길동',
      title: '주간 회의',
      meetingDate: '2026-07-10',
      startAt: '10:00:00',
      endAt: '11:00:00',
      isCanceled: false,
      participantCount: 1,
      participants: [{ empId: 101, deptName: '개발팀', empName: '김철수' }],
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: detail })

    const result = await getMeetingReservationDetail(10)

    expect(result).toEqual(detail)
  })
})
