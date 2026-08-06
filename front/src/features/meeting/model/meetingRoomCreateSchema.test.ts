import { describe, expect, it } from 'vitest'
import { meetingRoomCreateSchema } from './meetingRoomCreateSchema'

describe('meetingRoomCreateSchema', () => {
  it('유효한 값이면 성공한다', () => {
    const result = meetingRoomCreateSchema.safeParse({
      name: '대회의실',
      description: '층별 대형 회의실',
      capacity: 12,
    })
    expect(result.success).toBe(true)
  })

  it('name이 빈 문자열이면 실패한다', () => {
    const result = meetingRoomCreateSchema.safeParse({ name: '', description: '설명', capacity: 5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 이름을 입력해주세요')
    }
  })

  it('name이 공백만으로 이루어지면 실패한다', () => {
    const result = meetingRoomCreateSchema.safeParse({ name: '   ', description: '설명', capacity: 5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 이름은 공백만으로 입력할 수 없습니다')
    }
  })

  it('name이 50자를 초과하면 실패한다', () => {
    const result = meetingRoomCreateSchema.safeParse({
      name: 'a'.repeat(51),
      description: '설명',
      capacity: 5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 이름은 50자 이하로 입력해주세요')
    }
  })

  it('description이 빈 문자열이면 실패한다', () => {
    const result = meetingRoomCreateSchema.safeParse({ name: '대회의실', description: '', capacity: 5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 설명을 입력해주세요')
    }
  })

  it('description이 공백만으로 이루어지면 실패한다', () => {
    const result = meetingRoomCreateSchema.safeParse({ name: '대회의실', description: '   ', capacity: 5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('회의실 설명은 공백만으로 입력할 수 없습니다')
    }
  })

  it('capacity가 0 이하면 실패한다', () => {
    const result = meetingRoomCreateSchema.safeParse({ name: '대회의실', description: '설명', capacity: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('수용 인원은 양수여야 합니다')
    }
  })

  it('capacity 미입력(NaN, 빈 number input)이면 "수용 인원을 입력해주세요" 메시지가 노출된다', () => {
    const result = meetingRoomCreateSchema.safeParse({ name: '대회의실', description: '설명', capacity: NaN })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('수용 인원을 입력해주세요')
    }
  })

  it('capacity가 숫자가 아닌 값(문자열)이면 "숫자를 입력해주세요" 메시지가 노출된다', () => {
    const result = meetingRoomCreateSchema.safeParse({ name: '대회의실', description: '설명', capacity: '12' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('숫자를 입력해주세요')
    }
  })
})
