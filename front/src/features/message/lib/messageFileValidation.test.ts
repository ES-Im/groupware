import { describe, expect, it } from 'vitest'
import {
  MESSAGE_FILE_MAX_COUNT,
  MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES,
  MessageFileValidationError,
  validateMessageFileUpload,
} from './messageFileValidation'

/**
 * validateMessageFileUpload(ROADMAP(MESSAGE) T4.1) 첨부 사전검증 단위 테스트.
 *
 * 기준(도메인모델 _Message_file_ 실측): 쪽지당 최대 10개·총량 10MB. 확장자는 board/기안서
 * 허용목록과 동일. approval draftFileValidation.test.ts와 동일 축을 검증하되, 이 함수는 기존
 * 첨부 File[] 대신 existingTotalSize/existingCount(숫자)를 인자로 받는다는 시그니처 차이를
 * 반영한다.
 */

function makeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name)
}

describe('validateMessageFileUpload', () => {
  describe('개수 제한(COUNT_EXCEEDED)', () => {
    it('신규 파일 개수가 정확히 10개면 통과한다(경계값=허용)', () => {
      const files = Array.from({ length: MESSAGE_FILE_MAX_COUNT }, (_, i) => makeFile(`f${i}.pdf`, 1))
      expect(() => validateMessageFileUpload(files)).not.toThrow()
    })

    it('신규 파일 개수가 11개면 COUNT_EXCEEDED로 차단한다(경계값+1)', () => {
      const files = Array.from({ length: MESSAGE_FILE_MAX_COUNT + 1 }, (_, i) =>
        makeFile(`f${i}.pdf`, 1),
      )
      try {
        validateMessageFileUpload(files)
        throw new Error('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(MessageFileValidationError)
        expect((e as MessageFileValidationError).reason).toBe('COUNT_EXCEEDED')
        expect((e as MessageFileValidationError).code).toBeUndefined()
      }
    })

    it('기존 스테이징 개수와 신규 파일 합산이 10개 초과면 차단한다(existingCount 합산)', () => {
      try {
        validateMessageFileUpload([makeFile('new.pdf', 1)], 0, 10)
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as MessageFileValidationError).reason).toBe('COUNT_EXCEEDED')
      }
    })
  })

  describe('총량 제한(TOTAL_SIZE_EXCEEDED)', () => {
    it('총 용량이 정확히 10MB면 통과한다(경계값=허용)', () => {
      const files = [makeFile('big.pdf', MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES)]
      expect(() => validateMessageFileUpload(files)).not.toThrow()
    })

    it('총 용량이 10MB+1바이트면 TOTAL_SIZE_EXCEEDED로 차단한다(경계값+1)', () => {
      const files = [makeFile('big.pdf', MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES + 1)]
      try {
        validateMessageFileUpload(files)
        throw new Error('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(MessageFileValidationError)
        expect((e as MessageFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
      }
    })

    it('기존 스테이징 총량과 신규 파일 크기 합산이 10MB 초과면 차단한다(existingTotalSize 합산)', () => {
      try {
        validateMessageFileUpload([makeFile('new.pdf', 1)], MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES, 0)
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as MessageFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
      }
    })
  })

  describe('확장자 제한(EXTENSION_NOT_ALLOWED, FILE_003)', () => {
    it('허용 확장자(pdf)는 통과한다', () => {
      expect(() => validateMessageFileUpload([makeFile('doc.pdf', 1)])).not.toThrow()
    })

    it('대문자 확장자(PDF)도 소문자 변환 후 허용된다', () => {
      expect(() => validateMessageFileUpload([makeFile('doc.PDF', 1)])).not.toThrow()
    })

    it('비허용 확장자(exe)면 EXTENSION_NOT_ALLOWED + code FILE_003으로 차단한다', () => {
      try {
        validateMessageFileUpload([makeFile('virus.exe', 1)])
        throw new Error('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(MessageFileValidationError)
        expect((e as MessageFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
        expect((e as MessageFileValidationError).code).toBe('FILE_003')
      }
    })

    it('확장자 없는 파일도 비허용으로 차단한다', () => {
      try {
        validateMessageFileUpload([makeFile('noext', 1)])
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as MessageFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
      }
    })
  })

  describe('검증 우선순위(개수 → 총량 → 확장자)', () => {
    it('개수·확장자 위반이 동시면 개수(COUNT_EXCEEDED)를 먼저 던진다', () => {
      const files = Array.from({ length: MESSAGE_FILE_MAX_COUNT + 1 }, (_, i) =>
        makeFile(`bad${i}.exe`, 1),
      )
      try {
        validateMessageFileUpload(files)
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as MessageFileValidationError).reason).toBe('COUNT_EXCEEDED')
      }
    })

    it('총량·확장자 위반이 동시면 총량(TOTAL_SIZE_EXCEEDED)을 먼저 던진다', () => {
      const files = [makeFile('big.exe', MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES + 1)]
      try {
        validateMessageFileUpload(files)
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as MessageFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
      }
    })
  })

  it('빈 신규 파일 배열은 통과한다(existingTotalSize/existingCount 기본값 0)', () => {
    expect(() => validateMessageFileUpload([])).not.toThrow()
  })
})
