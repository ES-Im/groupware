import { describe, expect, it } from 'vitest'
import { meetingRoomUpdateSchema } from './meetingRoomUpdateSchema'

/**
 * meetingRoomUpdateSchema(MEETING_ROOM_UPDATE, ROADMAP(MEETING-ROOMS) T7.1) 단위 테스트.
 *
 * 전 필드 optional 계약과, capacity는 `setValueAs`로 빈 문자열→undefined 변환을 전제한다는
 * 계약(valueAsNumber:true 아님)을 확인한다 — 빈 값 제출(undefined)은 검증을 통과해야 하고,
 * 잘못된 값(0 이하·비양수·NaN)은 에러여야 한다.
 */
describe('meetingRoomUpdateSchema', () => {
  it('빈 객체({})는 전 필드가 optional이라 성공한다', () => {
    const result = meetingRoomUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('capacity가 undefined("빈 입력 → undefined" setValueAs 변환 후)면 성공한다', () => {
    const result = meetingRoomUpdateSchema.safeParse({ name: '대회의실', capacity: undefined })
    expect(result.success).toBe(true)
  })

  it('capacity에 유효한 양수를 지정하면 성공한다', () => {
    const result = meetingRoomUpdateSchema.safeParse({ capacity: 15 })
    expect(result.success).toBe(true)
  })

  it('capacity가 0 이하면 실패한다', () => {
    const result = meetingRoomUpdateSchema.safeParse({ capacity: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('수용 인원은 양수여야 합니다')
    }
  })

  it('capacity가 NaN이면(setValueAs 계약을 어기고 valueAsNumber처럼 NaN이 들어온 경우) "숫자를 입력해주세요" 에러다', () => {
    const result = meetingRoomUpdateSchema.safeParse({ capacity: NaN })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('숫자를 입력해주세요')
    }
  })

  it('name이 빈 문자열이면(변경 필드로 제출된 것이므로) 공백 거부 실패다(undefined와 다름)', () => {
    const result = meetingRoomUpdateSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 이름은 공백만으로 입력할 수 없습니다')
    }
  })

  it('name이 50자를 초과하면 실패한다', () => {
    const result = meetingRoomUpdateSchema.safeParse({ name: 'a'.repeat(51) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 이름은 50자 이하로 입력해주세요')
    }
  })

  it('description이 공백만으로 이루어지면 실패한다', () => {
    const result = meetingRoomUpdateSchema.safeParse({ description: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 설명은 공백만으로 입력할 수 없습니다')
    }
  })

  it('description이 undefined(미변경)면 성공한다', () => {
    const result = meetingRoomUpdateSchema.safeParse({ description: undefined })
    expect(result.success).toBe(true)
  })
})
