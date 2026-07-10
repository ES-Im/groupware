import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMyMeetingReservationsCalendar } from './getMyMeetingReservationsCalendar'

/**
 * getMyMeetingReservationsCalendar(F800, ROADMAP(MEETING-ROOMS) T1.3) 단위 테스트.
 *
 * apiClient.get을 직접 모킹해 axios 호출 인자(URL, params)와 응답 그대로 반환 여부만
 * 검증한다(leave getMyLeaveHistory.test.ts와 동일 패턴).
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: [] }) },
}))

describe('getMyMeetingReservationsCalendar', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('range 미전달 시 GET /api/meetings/my/reservations/calendar를 params 없이 호출한다', async () => {
    await getMyMeetingReservationsCalendar()

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/meetings/my/reservations/calendar')
    expect(config?.params).toBeUndefined()
  })

  it('range를 전달하면 params로 그대로 전달된다', async () => {
    const range = { start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' }
    await getMyMeetingReservationsCalendar(range)

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual(range)
  })

  it('응답 배열을 그대로 반환한다(파싱 가공 없음)', async () => {
    const items = [
      {
        meetingId: 10,
        meetingRoomId: 3,
        meetingRoomName: '대회의실',
        reserverId: 1,
        reserverDeptName: '개발팀',
        reserverEmpName: '홍길동',
        title: '주간 회의',
        meetingDate: '2026-06-19',
        startAt: '10:00:00',
        endAt: '11:00:00',
        isCanceled: false,
        participantCount: 2,
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: items })

    const result = await getMyMeetingReservationsCalendar()

    expect(result).toEqual(items)
  })
})
