/**
 * 이미지로 인라인 렌더 가능한 첨부 확장자 판별 헬퍼(ROADMAP(DRAFT) T6.2).
 * DraftFile.extension(model/draftDetail.ts, DRAFT_DETAIL 응답 실측 필드)을 그대로 받아 대소문자
 * 구분 없이 png/jpg/jpeg/gif 여부를 판정한다. T6.3(첨부 영역 조립)이 이 판정으로 인라인 미리보기
 * (useDraftFilePreviewUrl)와 일반 다운로드 버튼 렌더를 분기한다. board `isImageExtension`의 도메인
 * 독립 복제다(도메인마다 독립 정의하는 컨벤션 연장).
 */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif'])

export function isDraftImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}
