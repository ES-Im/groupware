import { describe, expect, it } from 'vitest'
import type { FranchiseEducationFileInfo } from '../model/franchise'
import { EducationFileValidationError, validateEducationFileUpload } from './educationFileValidation'

/**
 * validateEducationFileUpload 단위 테스트(board fileValidation.test.ts 동형 복제).
 * 도메인모델.md 기준(교육당 최대 10개·총 10MB·허용확장자 14종 화이트리스트, board와 동일 정책)의
 * 세 위반 유형을 각각 확인하고, 통과 케이스도 함께 검증한다.
 */

function makeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name)
}

function makeExistingFiles(count: number, sizeEach: number): FranchiseEducationFileInfo[] {
  return Array.from({ length: count }, (_, index) => ({
    fileId: index + 1,
    originalName: `existing-${index}.pdf`,
    extension: 'pdf',
    fileSize: sizeEach,
  }))
}

function captureError(run: () => void): unknown {
  try {
    run()
    return undefined
  } catch (error) {
    return error
  }
}

describe('validateEducationFileUpload', () => {
  it('개수·총량·확장자 모두 통과하면 예외를 던지지 않는다', () => {
    expect(() => validateEducationFileUpload([makeFile('a.pdf', 1024)], [])).not.toThrow()
  })

  it('기존 첨부가 없어도 신규 파일만으로 검증할 수 있다(existingFiles 생략)', () => {
    expect(() => validateEducationFileUpload([makeFile('a.png', 1024)])).not.toThrow()
  })

  it('기존+신규 합산 개수가 10개를 초과하면 COUNT_EXCEEDED를 던진다', () => {
    const existing = makeExistingFiles(9, 100)
    const newFiles = [makeFile('a.pdf', 100), makeFile('b.pdf', 100)]

    const error = captureError(() => validateEducationFileUpload(newFiles, existing))

    expect(error).toBeInstanceOf(EducationFileValidationError)
    expect((error as EducationFileValidationError).reason).toBe('COUNT_EXCEEDED')
    expect((error as EducationFileValidationError).message).toContain('10개')
  })

  it('기존+신규 합산이 정확히 10개면 통과한다(경계값)', () => {
    const existing = makeExistingFiles(9, 100)
    const newFiles = [makeFile('a.pdf', 100)]

    expect(() => validateEducationFileUpload(newFiles, existing)).not.toThrow()
  })

  it('기존+신규 합산 총량이 10MB를 초과하면 TOTAL_SIZE_EXCEEDED를 던진다', () => {
    const existing = makeExistingFiles(1, 9 * 1024 * 1024)
    const newFiles = [makeFile('a.pdf', 2 * 1024 * 1024)]

    const error = captureError(() => validateEducationFileUpload(newFiles, existing))

    expect(error).toBeInstanceOf(EducationFileValidationError)
    expect((error as EducationFileValidationError).reason).toBe('TOTAL_SIZE_EXCEEDED')
    expect((error as EducationFileValidationError).message).toContain('10MB')
  })

  it('허용되지 않는 확장자면 EXTENSION_NOT_ALLOWED(FILE_003)를 던진다', () => {
    const error = captureError(() => validateEducationFileUpload([makeFile('a.exe', 100)], []))

    expect(error).toBeInstanceOf(EducationFileValidationError)
    expect((error as EducationFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
    expect((error as EducationFileValidationError).code).toBe('FILE_003')
  })

  it('대소문자와 무관하게 확장자를 판별한다', () => {
    expect(() => validateEducationFileUpload([makeFile('a.PDF', 100)], [])).not.toThrow()
  })

  it.each(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'zip'])(
    '%s 확장자는 허용된다',
    (extension) => {
      expect(() => validateEducationFileUpload([makeFile(`a.${extension}`, 100)], [])).not.toThrow()
    },
  )

  it('확장자가 없는 파일명은 EXTENSION_NOT_ALLOWED를 던진다', () => {
    const error = captureError(() => validateEducationFileUpload([makeFile('noext', 100)], []))

    expect(error).toBeInstanceOf(EducationFileValidationError)
    expect((error as EducationFileValidationError).reason).toBe('EXTENSION_NOT_ALLOWED')
  })
})
