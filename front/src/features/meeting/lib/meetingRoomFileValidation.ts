/**
 * 회의실 안내 이미지 프론트 사전검증(ROADMAP(MEETING-ROOMS) T7.1, F815).
 *
 * 기준은 docs/backend-contract/file-upload.md(실측) — `meeting-rooms` 도메인은 이미지 전용
 * jpg/jpeg/png, 최대 10MB. board `fileValidation.ts`와 에러 클래스 구조·검증 함수 시그니처 패턴만
 * 동일하게 복제하고 상수는 회의실 고유값으로 새로 정의한다(gif 제외 — 이미지 전용 도메인이라
 * 문서 확장자 화이트리스트를 그대로 따른다). 개수 제한은 계약에 없어 과설계하지 않고
 * 확장자·용량만 검증한다(태스크 노트).
 */

export const MEETING_ROOM_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024

export const MEETING_ROOM_FILE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const

export type MeetingRoomFileValidationReason = 'EXTENSION_NOT_ALLOWED' | 'SIZE_EXCEEDED'

/**
 * 사전검증 위반 시 던지는 에러. `reason`으로 프론트가 분기하고, `message`는 그대로 토스트에 노출할
 * 수 있는 한국어 사용자 메시지다. board와 달리 용량도 서버가 파일 단위로 검증하는 계약이라
 * (docs/backend-contract/file-upload.md `FILE_002`) 확장자·용량 위반 모두 서버 대응 코드를 갖는다.
 */
export class MeetingRoomFileValidationError extends Error {
  readonly reason: MeetingRoomFileValidationReason
  readonly code: 'FILE_002' | 'FILE_003'

  constructor(reason: MeetingRoomFileValidationReason, message: string, code: 'FILE_002' | 'FILE_003') {
    super(message)
    this.name = 'MeetingRoomFileValidationError'
    this.reason = reason
    this.code = code
  }
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase()
}

function isAllowedExtension(extension: string): boolean {
  return (MEETING_ROOM_FILE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
}

/** 회의실 안내 이미지 업로드 사전검증(확장자 → 용량 순, 위반 시 첫 번째만 던진다). */
export function validateMeetingRoomFileUpload(file: File): void {
  const extension = getExtension(file.name)
  if (!isAllowedExtension(extension)) {
    throw new MeetingRoomFileValidationError(
      'EXTENSION_NOT_ALLOWED',
      `허용되지 않는 확장자입니다: ${extension ? `.${extension}` : '(확장자 없음)'}`,
      'FILE_003',
    )
  }

  if (file.size > MEETING_ROOM_FILE_MAX_SIZE_BYTES) {
    throw new MeetingRoomFileValidationError(
      'SIZE_EXCEEDED',
      `파일 크기는 ${MEETING_ROOM_FILE_MAX_SIZE_BYTES / (1024 * 1024)}MB를 초과할 수 없습니다`,
      'FILE_002',
    )
  }
}
