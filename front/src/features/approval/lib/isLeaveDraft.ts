import type { DraftDetailResponse } from '../model/draftDetail'

/**
 * 휴가 기안 판별 술어(ROADMAP(LEAVE) T2.1).
 *
 * **`draftType` 문자열 비교를 쓰지 않는다** — `isBusinessTripDraft.ts`와 동일한 사유로, 실측상
 * `draftType`은 백엔드 `getClass().getSimpleName()` 값이고 스니펫 값은 outdated라 신뢰할 수 없다.
 * 대신 ①의 DraftTypeBody 인라인 판별과 **동형인 슬롯-null 체크**로 판별한다:
 *   - leave 슬롯이 non-null이면 휴가 기안이다.
 * `isBusinessTripDraft`(businessTrip non-null)와 정확히 대칭인 축이며, 이 술어를 상세 [수정]
 * 라우팅(DrafterActions.handleEdit, M6)과 수정 페이지 진입 가드(LeaveDraftEditPage, T2.4)가 공유한다.
 */
export function isLeaveDraft(draft: DraftDetailResponse): boolean {
  return draft.leave != null
}
