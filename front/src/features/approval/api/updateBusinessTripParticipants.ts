import { apiClient } from '@/shared/api/client'

/**
 * 출장 참여자 전량 교체(`BUSINESS_TRIP_PARTICIPANTS_UPDATE`, F732,
 * `PATCH /api/drafts/business-trips/{draftId}/participants`, 기안자(EMPLOYEE)).
 *
 * request-fields.adoc 실측: body가 **최상위 bare 배열** `number[]`(참여자 사원 식별 번호 목록,
 * 필수·빈 배열 불가) — `{ empIds }` 같은 객체 래핑이 아니다(공람 `addCirculation`과 다른 구조).
 * add/remove가 아니라 **전량 교체**: 다이얼로그가 기존 참여자를 선반영해 사용자가 전체 집합을
 * 편집하고, 저장 시 현재 선택 전체를 보낸다. 성공 시 `204` Empty. 실패(빈 배열·권한/상태 위반)는
 * 그대로 던져 호출부 mutation이 handleApiError로 위임하도록 둔다.
 */
export async function updateBusinessTripParticipants(
  draftId: number,
  participantIds: number[],
): Promise<void> {
  await apiClient.patch(`/api/drafts/business-trips/${draftId}/participants`, participantIds)
}
