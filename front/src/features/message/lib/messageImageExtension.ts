/** 이미지로 인라인/모달 미리보기가 가능한 첨부 확장자(approval isDraftImageExtension의 message 로컬 복제). */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif'])

/**
 * 확장자가 이미지 미리보기 대상인지 판별한다. 상세 뷰(MessageAttachmentSection)와 편집 모드
 * 첨부(MessageComposeView)가 공유한다 — 한쪽만 바꿔 판별 기준이 어긋나는 것을 막는다.
 */
export function isMessageImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}
