import { describe, expect, it } from 'vitest'
import type { DraftFile } from '../model/draftDetail'
import {
  DRAFT_FILE_MAX_COUNT,
  DRAFT_FILE_MAX_TOTAL_SIZE_BYTES,
  DraftFileValidationError,
  validateDraftFileUpload,
} from './draftFileValidation'

/**
 * validateDraftFileUpload(ROADMAP(DRAFT) T6.1) 첨부 사전검증 단위 테스트.
 *
 * 기준(도메인모델 _Draft_file_ 실측): 기안서당 최대 10개·총량 10MB. 확장자는 board 허용목록과 동일.
 * 검증 순서(개수 → 총량 → 확장자)와 기존 파일 합산·경계값(정확히 한계=허용, 한계+1=차단)을 확인한다.
 * 확장자 위반만 서버 대응 코드(FILE_003)를 갖는다.
 */

function makeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name)
}

function existingFile(fileId: number, size: number): DraftFile {
  return {
    fileId,
    originalName: `existing-${fileId}.pdf`,
    mimeType: 'application/pdf',
    extension: 'pdf',
    fileSize: size,
  }
}

describe('validateDraftFileUpload', () => {
  describe('개수 제한(COUNT_EXCEEDED)', () => {
    it('신규 파일 개수가 정확히 10개면 통과한다(경계값=허용)', () => {
      const files = Array.from({ length: DRAFT_FILE_MAX_COUNT }, (_, i) => makeFile(`f${i}.pdf`, 1))
      expect(() => validateDraftFileUpload(files, [])).not.toThrow()
    })

    it('신규 파일 개수가 11개면 COUNT_EXCEEDED로 차단한다(경계값+1)', () => {
      const files = Array.from({ length: DRAFT_FILE_MAX_COUNT + 1 }, (_, i) =>
        makeFile(`f${i}.pdf`, 1),
      )
      expect(() => validateDraftFileUpload(files, [])).toThrow(DraftFileValidationError)
      try {
        validateDraftFileUpload(files, [])
      } catch (e) {
        expect((e as DraftFileValidationError).reason).toBe('COUNT_EXCEEDED')
        expect((e as DraftFileValidationError).code).toBeUndefined()
      }
    })

    it('기존 파일과 신규 파일 합산이 10개 초과면 차단한다(기존 합산)', () => {
      const existing = Array.from({ length: 10 }, (_, i) => existingFile(i + 1, 1))
      expect(() => validateDraftFileUpload([makeFile('new.pdf', 1)], existing)).toThrow(
        DraftFileValidationError,
      )
    })
  })

  describe('총량 제한(TOTAL_SIZE_EXCEEDED)', () => {
    it('총 용량이 정확히 10MB면 통과한다(경계값=허용)', () => {
      const files = [makeFile('big.pdf', DRAFT_FILE_MAX_TOTAL_SIZE_BYTES)]
      expect(() => validateDraftFileUpload(files, [])).not.toThrow()
    })

    it('총 용량이 10MB+1바이트면 TOTAL_SIZE_EXCEEDED로 차단한다(경계값+1)', () => {
      const files = [makeFile('big.pdf', DRAFT_FILE_MAX_TOTAL_SIZE_BYTES + 1)]
      try {
        validateDraftFileUpload(files, [])
        throw new Error('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(DraftFileValidationError)
        expect((e as DraftFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
      }
    })

    it('기존 파일 크기와 신규 파일 크기 합산이 10MB 초과면 차단한다(기존 합산)', () => {
      const existing = [existingFile(1, DRAFT_FILE_MAX_TOTAL_SIZE_BYTES)]
      const files = [makeFile('new.pdf', 1)]
      try {
        validateDraftFileUpload(files, existing)
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as DraftFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
      }
    })
  })

  describe('확장자 제한(EXTENSION_NOT_ALLOWED, FILE_003)', () => {
    it('허용 확장자(pdf)는 통과한다', () => {
      expect(() => validateDraftFileUpload([makeFile('doc.pdf', 1)], [])).not.toThrow()
    })

    it('대문자 확장자(PDF)도 소문자 변환 후 허용된다', () => {
      expect(() => validateDraftFileUpload([makeFile('doc.PDF', 1)], [])).not.toThrow()
    })

    it('비허용 확장자(exe)면 EXTENSION_NOT_ALLOWED + code FILE_003으로 차단한다', () => {
      try {
        validateDraftFileUpload([makeFile('virus.exe', 1)], [])
        throw new Error('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(DraftFileValidationError)
        expect((e as DraftFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
        expect((e as DraftFileValidationError).code).toBe('FILE_003')
      }
    })

    it('확장자 없는 파일도 비허용으로 차단한다', () => {
      try {
        validateDraftFileUpload([makeFile('noext', 1)], [])
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as DraftFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
      }
    })
  })

  describe('검증 우선순위(개수 → 총량 → 확장자)', () => {
    it('개수·확장자 위반이 동시면 개수(COUNT_EXCEEDED)를 먼저 던진다', () => {
      const files = Array.from({ length: DRAFT_FILE_MAX_COUNT + 1 }, (_, i) =>
        makeFile(`bad${i}.exe`, 1),
      )
      try {
        validateDraftFileUpload(files, [])
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as DraftFileValidationError).reason).toBe('COUNT_EXCEEDED')
      }
    })

    it('총량·확장자 위반이 동시면 총량(TOTAL_SIZE_EXCEEDED)을 먼저 던진다', () => {
      const files = [makeFile('big.exe', DRAFT_FILE_MAX_TOTAL_SIZE_BYTES + 1)]
      try {
        validateDraftFileUpload(files, [])
        throw new Error('should have thrown')
      } catch (e) {
        expect((e as DraftFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
      }
    })
  })

  it('빈 신규 파일 배열은 통과한다(existingFiles 기본값 [])', () => {
    expect(() => validateDraftFileUpload([])).not.toThrow()
  })
})
