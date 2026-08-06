export const EMP_FILE_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const EMP_FILE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const

export type EmpFileValidationReason = 'EXTENSION_NOT_ALLOWED' | 'SIZE_EXCEEDED'

export class EmpFileValidationError extends Error {
  readonly reason: EmpFileValidationReason
  readonly code: 'FILE_002' | 'FILE_003'

  constructor(reason: EmpFileValidationReason, message: string, code: 'FILE_002' | 'FILE_003') {
    super(message)
    this.name = 'EmpFileValidationError'
    this.reason = reason
    this.code = code
  }
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase()
}

function isAllowedExtension(extension: string): boolean {
  return (EMP_FILE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
}

export function validateEmpFileUpload(file: File): void {
  const extension = getExtension(file.name)
  if (!isAllowedExtension(extension)) {
    throw new EmpFileValidationError(
      'EXTENSION_NOT_ALLOWED',
      `허용되지 않는 확장자입니다: ${extension ? `.${extension}` : '(확장자 없음)'}`,
      'FILE_003',
    )
  }

  if (file.size > EMP_FILE_MAX_SIZE_BYTES) {
    throw new EmpFileValidationError(
      'SIZE_EXCEEDED',
      `파일 크기는 ${EMP_FILE_MAX_SIZE_BYTES / (1024 * 1024)}MB를 초과할 수 없습니다`,
      'FILE_002',
    )
  }
}
