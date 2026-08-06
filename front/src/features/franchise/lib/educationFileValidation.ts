import type { FranchiseEducationFileInfo } from '../model/franchise'

export const EDUCATION_FILE_MAX_COUNT = 10
export const EDUCATION_FILE_MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024

export const EDUCATION_FILE_ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'zip',
] as const

export type EducationFileValidationReason =
  | 'COUNT_EXCEEDED'
  | 'TOTAL_SIZE_EXCEEDED'
  | 'EXTENSION_NOT_ALLOWED'

export class EducationFileValidationError extends Error {
  readonly reason: EducationFileValidationReason
  readonly code?: 'FILE_003'

  constructor(reason: EducationFileValidationReason, message: string, code?: 'FILE_003') {
    super(message)
    this.name = 'EducationFileValidationError'
    this.reason = reason
    this.code = code
  }
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase()
}

function isAllowedExtension(extension: string): boolean {
  return (EDUCATION_FILE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
}

export function validateEducationFileUpload(
  newFiles: File[],
  existingFiles: FranchiseEducationFileInfo[] = [],
): void {
  const totalCount = existingFiles.length + newFiles.length
  if (totalCount > EDUCATION_FILE_MAX_COUNT) {
    throw new EducationFileValidationError(
      'COUNT_EXCEEDED',
      `첨부파일은 교육당 최대 ${EDUCATION_FILE_MAX_COUNT}개까지 첨부할 수 있습니다.`,
    )
  }

  const existingTotalSize = existingFiles.reduce((sum, file) => sum + file.fileSize, 0)
  const newFilesTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0)
  if (existingTotalSize + newFilesTotalSize > EDUCATION_FILE_MAX_TOTAL_SIZE_BYTES) {
    throw new EducationFileValidationError(
      'TOTAL_SIZE_EXCEEDED',
      `첨부파일 총 용량은 ${EDUCATION_FILE_MAX_TOTAL_SIZE_BYTES / (1024 * 1024)}MB를 초과할 수 없습니다.`,
    )
  }

  const invalidFile = newFiles.find((file) => !isAllowedExtension(getExtension(file.name)))
  if (invalidFile) {
    const extension = getExtension(invalidFile.name)
    throw new EducationFileValidationError(
      'EXTENSION_NOT_ALLOWED',
      `허용되지 않는 확장자입니다: ${extension ? `.${extension}` : '(확장자 없음)'}`,
      'FILE_003',
    )
  }
}
