/**
 * `CHAT_ROOM_DETAIL`의 `members[].profileImageUrl`은 이미 완성된 `EMP_FILE_PREVIEW` 경로
 * (예: `/api/employees/1/files/7/preview`, back ChatApiDocsTest.java 실측)로 내려온다.
 * 기존 공유 자산 `BlobAvatar`(T5.1)는 `empId`+`fileId`를 받아 동일 경로를 스스로 조립하는
 * 계약이라(재구축 금지 대상, useEmpFilePreviewUrl 참조), 이 유틸은 그 계약에 맞추기 위해
 * profileImageUrl 문자열에서 `fileId`만 파싱한다(empId는 이미 `members[].memberId`로 보유).
 *
 * 경로 형식이 예상과 다르면(계약 변경 등) undefined를 반환해 BlobAvatar가 이니셜 폴백을
 * 렌더하도록 한다 — 파싱 실패를 임의의 값으로 메꾸지 않는다.
 */
export function parseEmpFilePreviewFileId(profileImageUrl: string | null): number | undefined {
  if (!profileImageUrl) {
    return undefined
  }
  // EMP_FILE_PREVIEW 경로(`/api/employees/{empId}/files/{fileId}/preview`, api-endpoint.md
  // 실측)만 인정한다 — `/employees/` 세그먼트까지 고정해 다른 도메인의 유사한 preview 경로
  // (예: BOARD_FILE_PREVIEW)와 우연히 겹치지 않게 한다.
  const match = /\/employees\/\d+\/files\/(\d+)\/preview/.exec(profileImageUrl)
  if (!match) {
    return undefined
  }
  return Number(match[1])
}
