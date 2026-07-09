import type { DraftDetailResponse } from '../model/draftDetail'

/**
 * 출장 기안 판별 술어(ROADMAP(DRAFT-BUSINESSTRIP) T2.1).
 *
 * **`draftType` 문자열 비교를 쓰지 않는다** — `isGeneralDraft.ts`와 동일한 사유로, 실측상
 * `draftType`은 백엔드 `getClass().getSimpleName()` 값이고 스니펫의 "BUSINESS_TRIP"은 outdated라
 * 신뢰할 수 없다. 대신 ①의 DraftTypeBody 인라인 판별과 **동형인 슬롯-null 체크**로 판별한다:
 *   - businessTrip 슬롯이 non-null이면 출장 기안이다.
 * 이 술어를 상세 [수정] 라우팅(DrafterActions.handleEdit, T2.4)과 수정 페이지 진입 가드(T2.3)가 공유한다.
 *
 * `isGeneralDraft`(슬롯 전부 null)와 동형 축이며, 이 규칙은 ④연가(leave non-null)·⑤매출(sales
 * non-null) 판별에도 공통 적용되는 선례다(COMPLICATED-DOMAIN 후보 규약).
 */
export function isBusinessTripDraft(draft: DraftDetailResponse): boolean {
  return draft.businessTrip != null
}
