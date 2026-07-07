/**
 * 이미지로 인라인 렌더 가능한 첨부 확장자 판별 헬퍼(ROADMAP T11.2-b).
 * BoardFileInfo.extension(features/board/model/board.ts, BOARD_FILES 응답 실측 필드)을 그대로
 * 받아 대소문자 구분 없이 png/jpg/jpeg/gif 여부를 판정한다. T11.3(게시글 상세 첨부 목록)이
 * 이 판정으로 인라인 미리보기(useBoardFilePreviewUrl)와 일반 다운로드 링크 렌더를 분기한다.
 */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif'])

export function isImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}
