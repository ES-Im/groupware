import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { getMeetingRoomReservationsCalendar } from './getMeetingRoomReservationsCalendar'

/**
 * getMeetingRoomReservationsCalendar(F809, ROADMAP T2.3) 단위 테스트.
 */
vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: [] }) },
}))

describe('getMeetingRoomReservationsCalendar', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear()
  })

  it('range 미전달 시 params 없이 호출한다', async () => {
    await getMeetingRoomReservationsCalendar(3)

    expect(apiClient.get).toHaveBeenCalledTimes(1)
    const [url, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(url).toBe('/api/meeting-rooms/3/reservations/calendar')
    expect(config?.params).toBeUndefined()
  })

  it('range를 전달하면 params로 그대로 전달된다', async () => {
    const range = { start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' }
    await getMeetingRoomReservationsCalendar(3, range)

    const [, config] = vi.mocked(apiClient.get).mock.calls[0]
    expect(config?.params).toEqual(range)
  })

  it('응답 배열을 그대로 반환한다', async () => {
    const items = [
      { reserverDeptName: '개발팀', reserverEmpName: '홍길동', participantCount: 2, meetingDate: '2026-07-10', startAt: '10:00:00', endAt: '11:00:00' },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: items })

    const result = await getMeetingRoomReservationsCalendar(3)

    expect(result).toEqual(items)
  })
})
