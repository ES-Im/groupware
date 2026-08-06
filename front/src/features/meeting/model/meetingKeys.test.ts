import { describe, expect, it } from 'vitest'
import { meetingKeys } from './meetingKeys'

describe('meetingKeys', () => {
  it('all은 [\'meeting\']로 고정된다', () => {
    expect(meetingKeys.all).toEqual(['meeting'])
  })

  it('myReservationsCalendar(range)는 all을 prefix로 갖고 range를 그대로 반영한다', () => {
    const range = { start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' }
    expect(meetingKeys.myReservationsCalendar(range)).toEqual([
      'meeting',
      'myReservationsCalendar',
      range,
    ])
    expect(meetingKeys.myReservationsCalendar()).toEqual(['meeting', 'myReservationsCalendar', undefined])
  })

  it('roomDetail(meetingRoomId)는 id가 undefined여도(라우트 파라미터 파싱 전) 키를 구성한다', () => {
    expect(meetingKeys.roomDetail(3)).toEqual(['meeting', 'roomDetail', 3])
    expect(meetingKeys.roomDetail(undefined)).toEqual(['meeting', 'roomDetail', undefined])
  })

  it('roomReservationsCalendar(meetingRoomId, range)는 id와 range를 함께 반영한다', () => {
    const range = { start: '2026-07-01T00:00:00', end: '2026-07-31T23:59:59' }
    expect(meetingKeys.roomReservationsCalendar(3, range)).toEqual([
      'meeting',
      'roomReservationsCalendar',
      3,
      range,
    ])
  })

  it('roomFiles(meetingRoomId)는 id를 그대로 반영한다', () => {
    expect(meetingKeys.roomFiles(3)).toEqual(['meeting', 'roomFiles', 3])
  })

  it('availableRooms(params)는 params를 그대로 반영한다', () => {
    const params = { date: '2026-07-10', startAt: '10:00', endAt: '11:00', capacity: 4 }
    expect(meetingKeys.availableRooms(params)).toEqual(['meeting', 'availableRooms', params])
  })

  it('reservationDetail(meetingId)는 id를 그대로 반영한다', () => {
    expect(meetingKeys.reservationDetail(10)).toEqual(['meeting', 'reservationDetail', 10])
  })

  it('managementReservations(params)는 params를 그대로 반영한다', () => {
    const params = { yearMonth: '2026-07', page: 0, size: 10 }
    expect(meetingKeys.managementReservations(params)).toEqual([
      'meeting',
      'managementReservations',
      params,
    ])
  })

  it('roomManagement(params)는 params를 그대로 반영한다', () => {
    const params = { available: true, page: 0, size: 10 }
    expect(meetingKeys.roomManagement(params)).toEqual(['meeting', 'roomManagement', params])
  })
})
