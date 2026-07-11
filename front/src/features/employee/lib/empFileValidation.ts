/**
 * 사원 파일(프로필사진/전자서명) 프론트 사전검증.
 *
 * 기준은 docs/backend-contract/file-upload.md(실측) — `employees` 도메인은 이미지 전용
 * jpg/jpeg/png, 최대 5MB. meeting `meetingRoomFileValidation.ts`와 에러 클래스 구조·검증 함수
 * 시그니처 패턴만 동일하게 복제하고 상수는 사원 고유값(5MB)으로 새로 정의한다.
 */

export const EMP_FILE_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const EMP_FILE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const

export type EmpFileValidationReason = 'EXTENSION_NOT_ALLOWED' | 'SIZE_EXCEEDED'

/**
 * 사전검증 위반 시 던지는 에러. `reason`으로 프론트가 분기하고, `message`는 그대로 토스트에 노출할
 * 수 있는 한국어 사용자 메시지다(meetingRoomFileValidation.ts의 MeetingRoomFileValidationError 동형).
 */
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

/** 사원 파일(프로필사진/전자서명) 업로드 사전검증(확장자 → 용량 순, 위반 시 첫 번째만 던진다). */
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
