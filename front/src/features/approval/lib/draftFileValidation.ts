import type { DraftFile } from '../model/draftDetail'

export const DRAFT_FILE_MAX_COUNT = 10
export const DRAFT_FILE_MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024

export const DRAFT_FILE_ALLOWED_EXTENSIONS = [
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

export type DraftFileValidationReason =
  | 'COUNT_EXCEEDED'
  | 'TOTAL_SIZE_EXCEEDED'
  | 'EXTENSION_NOT_ALLOWED'

export class DraftFileValidationError extends Error {
  readonly reason: DraftFileValidationReason
  readonly code?: 'FILE_003'

  constructor(reason: DraftFileValidationReason, message: string, code?: 'FILE_003') {
    super(message)
    this.name = 'DraftFileValidationError'
    this.reason = reason
    this.code = code
  }
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase()
}

function isAllowedExtension(extension: string): boolean {
  return (DRAFT_FILE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
}

export function validateDraftFileUpload(newFiles: File[], existingFiles: DraftFile[] = []): void {
  const totalCount = existingFiles.length + newFiles.length
  if (totalCount > DRAFT_FILE_MAX_COUNT) {
    throw new DraftFileValidationError(
      'COUNT_EXCEEDED',
      `첨부파일은 기안서당 최대 ${DRAFT_FILE_MAX_COUNT}개까지 첨부할 수 있습니다.`,
    )
  }

  const existingTotalSize = existingFiles.reduce((sum, file) => sum + file.fileSize, 0)
  const newFilesTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0)
  if (existingTotalSize + newFilesTotalSize > DRAFT_FILE_MAX_TOTAL_SIZE_BYTES) {
    throw new DraftFileValidationError(
      'TOTAL_SIZE_EXCEEDED',
      `첨부파일 총 용량은 ${DRAFT_FILE_MAX_TOTAL_SIZE_BYTES / (1024 * 1024)}MB를 초과할 수 없습니다.`,
    )
  }

  const invalidFile = newFiles.find((file) => !isAllowedExtension(getExtension(file.name)))
  if (invalidFile) {
    const extension = getExtension(invalidFile.name)
    throw new DraftFileValidationError(
      'EXTENSION_NOT_ALLOWED',
      `허용되지 않는 확장자입니다: ${extension ? `.${extension}` : '(확장자 없음)'}`,
      'FILE_003',
    )
  }
}
