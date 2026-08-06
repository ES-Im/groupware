export const MESSAGE_FILE_MAX_COUNT = 10
export const MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024

export const MESSAGE_FILE_ALLOWED_EXTENSIONS = [
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

export type MessageFileValidationReason =
  | 'COUNT_EXCEEDED'
  | 'TOTAL_SIZE_EXCEEDED'
  | 'EXTENSION_NOT_ALLOWED'

export class MessageFileValidationError extends Error {
  readonly reason: MessageFileValidationReason
  readonly code?: 'FILE_003'

  constructor(reason: MessageFileValidationReason, message: string, code?: 'FILE_003') {
    super(message)
    this.name = 'MessageFileValidationError'
    this.reason = reason
    this.code = code
  }
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase()
}

function isAllowedExtension(extension: string): boolean {
  return (MESSAGE_FILE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
}

export function validateMessageFileUpload(
  newFiles: File[],
  existingTotalSize = 0,
  existingCount = 0,
): void {
  const totalCount = existingCount + newFiles.length
  if (totalCount > MESSAGE_FILE_MAX_COUNT) {
    throw new MessageFileValidationError(
      'COUNT_EXCEEDED',
      `첨부파일은 쪽지당 최대 ${MESSAGE_FILE_MAX_COUNT}개까지 첨부할 수 있습니다.`,
    )
  }

  const newFilesTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0)
  if (existingTotalSize + newFilesTotalSize > MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES) {
    throw new MessageFileValidationError(
      'TOTAL_SIZE_EXCEEDED',
      `첨부파일 총 용량은 ${MESSAGE_FILE_MAX_TOTAL_SIZE_BYTES / (1024 * 1024)}MB를 초과할 수 없습니다.`,
    )
  }

  const invalidFile = newFiles.find((file) => !isAllowedExtension(getExtension(file.name)))
  if (invalidFile) {
    const extension = getExtension(invalidFile.name)
    throw new MessageFileValidationError(
      'EXTENSION_NOT_ALLOWED',
      `허용되지 않는 확장자입니다: ${extension ? `.${extension}` : '(확장자 없음)'}`,
      'FILE_003',
    )
  }
}
