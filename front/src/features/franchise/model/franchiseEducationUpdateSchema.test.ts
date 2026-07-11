import { describe, expect, it } from 'vitest'
import { franchiseEducationUpdateSchema } from './franchiseEducationUpdateSchema'

/**
 * franchiseEducationUpdateSchema(FRANCHISE_EDUCATION_UPDATE, ROADMAP(FRANCHISE) T4.4, F1613) 단위 테스트.
 * meetingRoomUpdateSchema.test.ts와 동일 패턴(safeParse + issues[0].message 단언).
 *
 * 전 필드 optional(부분수정) — 빈 객체도 성공해야 한다. 계약에 문서화된 제약만 검증한다:
 * educationDate(yyyy-MM-dd'T'HH:mm:ss regex)·place/title(50자 이하)·content(공백만 거부)·
 * capacity(양수).
 */

describe('franchiseEducationUpdateSchema', () => {
  it('빈 객체({})는 성공한다(전 필드 optional, PATCH 부분수정)', () => {
    const result = franchiseEducationUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('전 필드를 유효한 값으로 채우면 성공한다', () => {
    const result = franchiseEducationUpdateSchema.safeParse({
      educationDate: '2026-05-01T10:00:00',
      place: '본사 3층 강당',
      title: '신규 가맹점 오리엔테이션',
      content: '가맹 운영 기본 교육입니다',
      capacity: 20,
    })
    expect(result.success).toBe(true)
  })

  describe('educationDate', () => {
    it('yyyy-MM-ddTHH:mm:ss 형식이 아니면 실패한다(초 단위 없음)', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ educationDate: '2026-05-01T10:00' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '교육 일시는 yyyy-MM-ddTHH:mm:ss 형식으로 입력해주세요',
        )
      }
    })

    it('완전한 형식(초 포함)이면 성공한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({
        educationDate: '2026-05-01T10:00:00',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('place', () => {
    it('50자를 초과하면 실패한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ place: '가'.repeat(51) })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('교육 장소는 50자 이하로 입력해주세요')
      }
    })

    it('경계값 50자는 성공한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ place: '가'.repeat(50) })
      expect(result.success).toBe(true)
    })
  })

  describe('title', () => {
    it('50자를 초과하면 실패한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ title: '가'.repeat(51) })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('교육 제목은 50자 이하로 입력해주세요')
      }
    })

    it('경계값 50자는 성공한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ title: '가'.repeat(50) })
      expect(result.success).toBe(true)
    })
  })

  describe('content', () => {
    it('공백만으로 이루어지면 실패한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ content: '   ' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('교육 내용은 공백만으로 입력할 수 없습니다')
      }
    })

    it('빈 문자열이면 실패한다(trim 후 길이 0)', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ content: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('교육 내용은 공백만으로 입력할 수 없습니다')
      }
    })

    it('내용이 있으면 성공한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ content: '가맹 운영 기본 교육' })
      expect(result.success).toBe(true)
    })
  })

  describe('capacity', () => {
    it('0이면 실패한다(양수여야 함)', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ capacity: 0 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('정원은 양수여야 합니다')
      }
    })

    it('음수면 실패한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ capacity: -5 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('정원은 양수여야 합니다')
      }
    })

    it('숫자가 아니면 "숫자를 입력해주세요"로 실패한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ capacity: '20' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('숫자를 입력해주세요')
      }
    })

    it('양수면 성공한다', () => {
      const result = franchiseEducationUpdateSchema.safeParse({ capacity: 20 })
      expect(result.success).toBe(true)
    })
  })
})
