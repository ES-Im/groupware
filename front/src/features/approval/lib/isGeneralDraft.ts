import type { DraftDetailResponse } from '../model/draftDetail'

/**
 * 일반 기안(순수 일반 기안서) 판별 술어(ROADMAP(DRAFT-COMMON) T2.1, Major M1).
 *
 * **`draftType` 문자열 비교를 쓰지 않는다** — 실측상 `draftType`은 백엔드 `getClass().getSimpleName()`
 * 값(일반기안 = "GeneralDraft", "GENERAL" 아님)이고 스니펫의 "BUSINESS_TRIP"은 outdated라 신뢰할 수
 * 없다. 대신 ①의 DraftTypeBody 인라인 판별과 **동형인 슬롯-null 체크**로 판별한다:
 *   - leave/businessTrip/sales 유형 슬롯이 전부 null(GENERAL은 셋 다 null)
 *   - + sourceDraftId가 null(취소기안이 아님)
 * 이 술어를 상세 [수정] 라우팅(DrafterActions.handleEdit)과 수정 페이지 진입 가드가 공유한다.
 *
 * 이 규칙은 ③출장(businessTrip non-null)·④연가(leave non-null)·⑤매출(sales non-null)·취소기안
 * (sourceDraftId non-null) 판별에도 공통 적용되는 선례다(COMPLICATED-DOMAIN 후보 규약).
 */
export function isGeneralDraft(draft: DraftDetailResponse): boolean {
  return (
    draft.leave == null &&
    draft.businessTrip == null &&
    draft.sales == null &&
    draft.sourceDraftId == null
  )
}
