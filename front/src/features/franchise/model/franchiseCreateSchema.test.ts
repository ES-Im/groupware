import { describe, expect, it } from 'vitest'
import { franchiseCreateSchema } from './franchiseCreateSchema'

/**
 * franchiseCreateSchema(FRANCHISE_CREATE, ROADMAP(FRANCHISE) T2.2, F1603) 단위 테스트.
 * meetingRoomCreateSchema.test.ts와 동일 패턴(safeParse + issues[0].message 단언).
 *
 * - businessNumber: 필수 + `000-00-00000`(하이픈 포함 12자) regex.
 * - franchiseName/address/ownerName: 필수 + 최대 길이(50/200/50) + 공백만 입력 거부(refine).
 * - contactNumber: 필수 + `010-000(0)-0000` 휴대폰 형식 regex(백엔드 런타임 실측 — 스키마 주석 참고).
 * - contactEmail: z.email 형식 검증.
 * - managerEmpId: optional number(폼 밖 EmployeePicker 합성 필드).
 */

/** 전 필드 유효한 기준값. 각 케이스는 여기서 하나만 덮어써 실패 원인을 격리한다. */
function validValues(overrides?: Record<string, unknown>) {
  return {
    businessNumber: '123-45-67890',
    franchiseName: 'HARUON 강남점',
    address: '서울특별시 강남구 테헤란로 1',
    ownerName: '홍길동',
    contactNumber: '010-1234-5678',
    contactEmail: 'gangnam@haruon.com',
    ...overrides,
  }
}

describe('franchiseCreateSchema', () => {
  it('유효한 값이면(managerEmpId 미포함) 성공한다', () => {
    const result = franchiseCreateSchema.safeParse(validValues())
    expect(result.success).toBe(true)
  })

  it('managerEmpId를 숫자로 포함해도 성공한다(선택 필드)', () => {
    const result = franchiseCreateSchema.safeParse(validValues({ managerEmpId: 7 }))
    expect(result.success).toBe(true)
  })

  it('managerEmpId가 숫자가 아니면 실패한다', () => {
    const result = franchiseCreateSchema.safeParse(validValues({ managerEmpId: '7' }))
    expect(result.success).toBe(false)
  })

  describe('businessNumber', () => {
    it('빈 문자열이면 "사업자번호를 입력해주세요"로 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ businessNumber: '' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('사업자번호를 입력해주세요')
      }
    })

    it('하이픈 없는 10자리 숫자면 형식 메시지로 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ businessNumber: '1234567890' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '사업자번호는 000-00-00000 형식(12자)으로 입력해주세요',
        )
      }
    })

    it('자릿수 배열이 다르면(3-3-5) 형식 메시지로 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(
        validValues({ businessNumber: '123-456-7890' }),
      )
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '사업자번호는 000-00-00000 형식(12자)으로 입력해주세요',
        )
      }
    })
  })

  describe('franchiseName', () => {
    it('빈 문자열이면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ franchiseName: '' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('가맹점명을 입력해주세요')
      }
    })

    it('공백만으로 이루어지면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ franchiseName: '   ' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('가맹점명은 공백만으로 입력할 수 없습니다')
      }
    })

    it('50자를 초과하면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(
        validValues({ franchiseName: '가'.repeat(51) }),
      )
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('가맹점명은 50자 이하로 입력해주세요')
      }
    })

    it('경계값 50자는 성공한다', () => {
      const result = franchiseCreateSchema.safeParse(
        validValues({ franchiseName: '가'.repeat(50) }),
      )
      expect(result.success).toBe(true)
    })
  })

  describe('address', () => {
    it('빈 문자열이면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ address: '' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('주소를 입력해주세요')
      }
    })

    it('공백만으로 이루어지면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ address: '   ' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('주소는 공백만으로 입력할 수 없습니다')
      }
    })

    it('200자를 초과하면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ address: '주'.repeat(201) }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('주소는 200자 이하로 입력해주세요')
      }
    })
  })

  describe('ownerName', () => {
    it('빈 문자열이면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ ownerName: '' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('대표자명을 입력해주세요')
      }
    })

    it('공백만으로 이루어지면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ ownerName: '   ' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('대표자명은 공백만으로 입력할 수 없습니다')
      }
    })

    it('50자를 초과하면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ ownerName: '홍'.repeat(51) }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('대표자명은 50자 이하로 입력해주세요')
      }
    })
  })

  describe('contactNumber', () => {
    it('빈 문자열이면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ contactNumber: '' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('연락처를 입력해주세요')
      }
    })

    it('공백만으로 이루어지면 형식 메시지로 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ contactNumber: '   ' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('연락처는 010-0000-0000 형식으로 입력해주세요')
      }
    })

    it('휴대폰(010) 형식이 아니면 실패한다(백엔드 런타임 실측 규칙)', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ contactNumber: '02-1234-5678' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('연락처는 010-0000-0000 형식으로 입력해주세요')
      }
    })

    it('중간 자릿수 3자리(010-000-0000)도 성공한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ contactNumber: '010-123-4567' }))
      expect(result.success).toBe(true)
    })
  })

  describe('contactEmail', () => {
    it('이메일 형식이 아니면 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ contactEmail: 'not-an-email' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('올바른 이메일 형식이 아닙니다')
      }
    })

    it('빈 문자열이면 형식 메시지로 실패한다', () => {
      const result = franchiseCreateSchema.safeParse(validValues({ contactEmail: '' }))
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('올바른 이메일 형식이 아닙니다')
      }
    })
  })
})
