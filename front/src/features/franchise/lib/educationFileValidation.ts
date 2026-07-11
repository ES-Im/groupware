import type { FranchiseEducationFileInfo } from '../model/franchise'

/**
 * 교육 첨부파일 프론트 사전검증.
 *
 * 기준은 `@../docs/도메인모델.md`(Education_file 섹션, 1183~1222행) — 교육당 첨부파일 최대
 * 10개·총 용량 10MB(board/draft와 동일 컨벤션 채택). `docs/backend-contract/file-upload.md`의
 * `educations` per-file 20MB는 서버 multipart 상위 천장(더 느슨한 제약)이라 프론트 사전검증
 * 기준으로 채택하지 않는다(계약 정합, board `fileValidation.ts`와 동일 근거).
 *
 * 확장자 화이트리스트는 board와 동일 14종(도메인모델.md 'DraftFile과 규칙 동일' 명시 +
 * file-upload.md educations 행 실측: "게시판과 동일").
 */

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

/**
 * 사전검증 위반 시 던지는 에러. `reason`으로 프론트가 분기하고, `message`는 그대로 토스트에 노출할
 * 수 있는 한국어 사용자 메시지다. 확장자 위반만 `code`(`FILE_003`, 서버 대응 코드 존재)를 갖는다.
 */
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

/**
 * newFiles(신규 업로드 예정)를 existingFiles(현재 첨부, FRANCHISE_EDUCATION_DETAIL의
 * `fileListInfoList`) 기준과 합산해 검증한다. 개수/총량은 "기존 + 신규" 누적 기준, 확장자는
 * 신규 파일 각각을 검사한다.
 *
 * 위반이 여럿이어도 첫 번째(개수 → 총량 → 확장자 순)만 던진다(board `validateBoardFileUpload`
 * 동형) — 호출부(`useEducationFileUploadMutation`)가 여러 파일을 순차 PATCH하기 전에 배치 전체를
 * 한 번에 차단하는 정책과 합친다.
 */
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
