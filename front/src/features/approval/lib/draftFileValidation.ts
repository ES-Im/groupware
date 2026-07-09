import type { DraftFile } from '../model/draftDetail'

/**
 * 기안서 첨부파일 프론트 사전검증(ROADMAP(DRAFT) T6.1).
 *
 * 기준은 `@../docs/도메인모델.md` _Draft_file_ 애그리거트 실측 — 기안서당 첨부파일 최대 10개·총 용량
 * 10MB. `docs/backend-contract/file-upload.md`의 `drafts` 첨부 per-file 20MB는 서버 multipart 상위
 * 천장(더 느슨한 제약)이라 프론트 사전검증 기준으로 채택하지 않는다(계약 정합). 허용 확장자 목록은
 * 게시판과 동일(도메인모델 _Draft_file_ ext→mimeType 허용목록 = board와 동일 세트).
 *
 * 개수·총량 제약은 도메인모델 규칙으로 명시되나 서버 대응 에러코드는 확장자 위반(`FILE_003`,
 * file-upload.md 실측)만 존재하므로, 확장자만 서버 코드를 재사용하고 개수·총량은 순수 프론트 UX
 * 사전검증으로 차단한다(board `fileValidation` 복제 — 도메인 독립 컨벤션). 상수·에러 형태는 board와
 * 동형이되 이름만 draft 도메인으로 둔다.
 */

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

/**
 * 사전검증 위반 시 던지는 에러. `reason`으로 프론트가 분기하고, `message`는 그대로 토스트에 노출할
 * 수 있는 한국어 사용자 메시지다. 확장자 위반만 `code`(`FILE_003`, 서버 대응 코드 존재)를 갖는다.
 */
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

/**
 * newFiles(신규 업로드 예정)를 existingFiles(현재 첨부, 상세 응답 `draft.files`) 기준과 합산해
 * 검증한다. 개수/총량은 "기존 + 신규" 누적 기준, 확장자는 신규 파일 각각을 검사한다.
 *
 * 위반이 여럿이어도 첫 번째(개수 → 총량 → 확장자 순)만 던진다 — 호출부(useDraftFileUploadMutation)가
 * 여러 파일을 순차 PATCH하기 전에 배치 전체를 한 번에 차단하는 정책과 합친다(Open Q#6, 순차 PATCH
 * 기본안).
 */
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
