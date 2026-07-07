import type { BoardFileInfo } from '../model/board'

/**
 * 게시글 첨부파일 프론트 사전검증(ROADMAP T13.2).
 *
 * 기준은 `@../docs/도메인모델.md`(BoardFile 애그리거트) — 게시글당 첨부파일 최대 10개·총 용량
 * 10MB. `docs/backend-contract/file-upload.md`의 게시판 첨부 per-file 20MB는 서버 multipart
 * 상위 천장(더 느슨한 제약)이라 프론트 사전검증 기준으로 채택하지 않는다(계약 정합).
 *
 * back/src/main/java의 `Board.addBoardFile()`/`BoardFileCommandService`를 실측한 결과 개수·총량
 * 제약을 강제하는 서버측 코드는 없다 — 즉 개수·총량 검증은 서버에 대응 에러코드가 없는 순수
 * 프론트 UX 규칙이다. 확장자 화이트리스트만 백엔드 `UNSUPPORTED_FILE_EXTENSION_EXCEPTION`
 * (`FILE_003`, `ApplicationErrorCode.java` 실측)과 1:1 대응하므로 그 코드를 그대로 재사용한다.
 */

export const BOARD_FILE_MAX_COUNT = 10
export const BOARD_FILE_MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024

export const BOARD_FILE_ALLOWED_EXTENSIONS = [
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

export type BoardFileValidationReason = 'COUNT_EXCEEDED' | 'TOTAL_SIZE_EXCEEDED' | 'EXTENSION_NOT_ALLOWED'

/**
 * 사전검증 위반 시 던지는 에러. `reason`으로 프론트가 분기하고, `message`는 그대로 토스트에 노출할
 * 수 있는 한국어 사용자 메시지다. 확장자 위반만 `code`(`FILE_003`, 서버 대응 코드 존재)를 갖는다.
 */
export class BoardFileValidationError extends Error {
  readonly reason: BoardFileValidationReason
  readonly code?: 'FILE_003'

  constructor(reason: BoardFileValidationReason, message: string, code?: 'FILE_003') {
    super(message)
    this.name = 'BoardFileValidationError'
    this.reason = reason
    this.code = code
  }
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase()
}

function isAllowedExtension(extension: string): boolean {
  return (BOARD_FILE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
}

/**
 * newFiles(신규 업로드 예정)를 existingFiles(현재 첨부, `useBoardFilesQuery` 응답) 기준과 합산해
 * 검증한다. 개수/총량은 "기존 + 신규" 누적 기준, 확장자는 신규 파일 각각을 검사한다.
 *
 * 위반이 여럿이어도 첫 번째(개수 → 총량 → 확장자 순, Done조건 표기 순서)만 던진다 — 호출부
 * (useBoardFileUploadMutation)가 여러 파일을 순차 PATCH하기 전에 배치 전체를 한 번에 차단하는
 * 정책과 합친다(§열린항목3, 순차 PATCH 기본안).
 */
export function validateBoardFileUpload(newFiles: File[], existingFiles: BoardFileInfo[] = []): void {
  const totalCount = existingFiles.length + newFiles.length
  if (totalCount > BOARD_FILE_MAX_COUNT) {
    throw new BoardFileValidationError(
      'COUNT_EXCEEDED',
      `첨부파일은 게시글당 최대 ${BOARD_FILE_MAX_COUNT}개까지 첨부할 수 있습니다.`,
    )
  }

  const existingTotalSize = existingFiles.reduce((sum, file) => sum + file.fileSize, 0)
  const newFilesTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0)
  if (existingTotalSize + newFilesTotalSize > BOARD_FILE_MAX_TOTAL_SIZE_BYTES) {
    throw new BoardFileValidationError(
      'TOTAL_SIZE_EXCEEDED',
      `첨부파일 총 용량은 ${BOARD_FILE_MAX_TOTAL_SIZE_BYTES / (1024 * 1024)}MB를 초과할 수 없습니다.`,
    )
  }

  const invalidFile = newFiles.find((file) => !isAllowedExtension(getExtension(file.name)))
  if (invalidFile) {
    const extension = getExtension(invalidFile.name)
    throw new BoardFileValidationError(
      'EXTENSION_NOT_ALLOWED',
      `허용되지 않는 확장자입니다: ${extension ? `.${extension}` : '(확장자 없음)'}`,
      'FILE_003',
    )
  }
}
