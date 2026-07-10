import dayjs from 'dayjs'
import type { MeetingReservationDetail } from '../model/meeting'

/**
 * 예약자 본인 액션(수정/참여자교체/취소) 노출 판정 순수 함수(ROADMAP(MEETING-ROOMS) T4.3-a).
 *
 * 판정 기준(PRD §페이지별 상세 P3·§사용자 여정 권한 분기점):
 *   - 예약자 본인(`detail.reserverId === myEmpId`)이고,
 *   - 아직 취소되지 않았고(`isCanceled === false`),
 *   - 회의일이 내일 이후(수정 가능 기간 "1일 전까지" 규칙의 프론트 힌트).
 * 세 조건을 모두 충족해야 true — 이 판정은 버튼 노출 힌트일 뿐 최종 인가는 서버가 한다
 * (기간 위반·소유자 불일치는 서버가 도메인 에러/403으로 최종 판정).
 *
 * myEmpId 소스: `useMeQuery().data?.empBasicInfo.empId`. 로딩 전/부재로 undefined가 들어오면
 * fail-closed로 false를 반환한다(resolveDrafterActions·isMyApprovalTurn과 동일 원칙).
 * FACILITY가 P5(회의 예약 관리) 경유로 조회 전용 진입 시에도 reserverId가 자신과 다르므로
 * 이 함수가 자연히 false를 반환해 액션 영역을 숨긴다(별도 role 분기 불필요).
 */
export function canManageReservation(
  detail: MeetingReservationDetail,
  myEmpId: number | undefined,
): boolean {
  if (myEmpId === undefined) {
    return false
  }
  return (
    detail.reserverId === myEmpId &&
    !detail.isCanceled &&
    dayjs(detail.meetingDate).isAfter(dayjs(), 'day')
  )
}
