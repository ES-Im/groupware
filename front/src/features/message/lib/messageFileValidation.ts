/**
 * 쪽지 첨부파일 프론트 사전검증(ROADMAP(MESSAGE) T4.1).
 *
 * 기준은 `@../docs/도메인모델.md` _Message_file_ 애그리셔트 실측 — 쪽지당 첨부파일 최대 10개·총
 * 용량 10MB. `docs/backend-contract/file-upload.md`의 서버 전역 상한(20MB)은 더 느슨한 상위
 * 천장이라 여기서는 채택하지 않는다(계약 정합). 허용 확장자 목록은 게시판·기안서와 동일 세트다.
 *
 * approval `draftFileValidation.ts`의 구조를 그대로 복제하되, 이 컴포넌트(MessageComposeView)는
 * 서버 응답의 기존 첨부(DraftFile 등)를 다루지 않고 로컬 File[] 스테이징만 다루므로, 기존 파일
 * 목록 대신 현재까지 스테이징된 총량/개수(existingTotalSize/existingCount)를 인자로 받는다.
 */

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

/**
 * 사전검증 위반 시 던지는 에러. `reason`으로 프론트가 분기하고, `message`는 그대로 토스트에 노출할
 * 수 있는 한국어 사용자 메시지다. 확장자 위반만 `code`(`FILE_003`, 서버 대응 코드 존재)를 갖는다.
 */
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

/**
 * newFiles(신규 추가 예정)를 existingTotalSize/existingCount(현재 스테이징된 첨부) 기준과 합산해
 * 검증한다. 위반이 여럿이어도 첫 번째(개수 → 총량 → 확장자 순)만 던진다(draftFileValidation과
 * 동일 정책).
 */
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
