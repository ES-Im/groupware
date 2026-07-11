/**
 * 이미지로 인라인 렌더 가능한 첨부 확장자 판별 헬퍼.
 * FranchiseEducationFileInfo.extension(model/franchise.ts)을 그대로 받아 대소문자 구분 없이
 * png/jpg/jpeg/gif 여부를 판정한다. board `isImageExtension`/draft `isDraftImageExtension`의
 * 도메인 독립 복제다(도메인마다 독립 정의하는 컨벤션 연장).
 */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif'])

export function isEducationImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}
