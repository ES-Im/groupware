import type { AttendanceStatus } from '@/features/attendance/model/attendance'

/**
 * shadcn Badge의 표준 variant(default/secondary/destructive/outline) 중 하나.
 * 프로젝트에 Badge 프리미티브가 아직 없어(board/department 도메인도 미보유) 신규 컨벤션을 정의한다
 * (ROADMAP2.md T1.3). T1.5(내 근태 페이지)·M3 T3.4(부서 근태)에서 실제 Badge 컴포넌트 렌더링 시 소비.
 */
export type AttendanceBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface AttendanceStatusBadgeInfo {
  label: string
  variant: AttendanceBadgeVariant
}

/**
 * AttendanceStatus(6개, front/docs/prd/5.attendance-prd.md §참조 계약 매핑 실측) → 배지 표시 정보 매핑.
 * 라벨은 PRD "AttendanceStatus enum(도메인모델 실측)" 절 그대로: NORMAL(정상)·LATE_EARLY(지각/조퇴)·
 * HALF_DAY_LEAVE(반차)·ALL_DAY_LEAVE(연차)·SICK_LEAVE(병가)·ABSENT(결근).
 * variant는 PRD/백엔드 계약에 색상 규칙이 없어 이번 태스크에서 합리적으로 가정한 값이다(사용자 보고 대상):
 * 정상=default, 지각/조퇴·결근(근태 위반성)=destructive, 반차/연차(승인된 휴가성)=secondary, 병가=outline.
 */
export const attendanceStatusBadgeMap: Record<AttendanceStatus, AttendanceStatusBadgeInfo> = {
  NORMAL: { label: '정상', variant: 'default' },
  LATE_EARLY: { label: '지각/조퇴', variant: 'destructive' },
  HALF_DAY_LEAVE: { label: '반차', variant: 'secondary' },
  ALL_DAY_LEAVE: { label: '연차', variant: 'secondary' },
  SICK_LEAVE: { label: '병가', variant: 'outline' },
  ABSENT: { label: '결근', variant: 'destructive' },
}

/**
 * attendanceStatusBadgeMap 조회 헬퍼. status가 null이면 "출근만 하고 아직 퇴근·마감 전"인
 * 진행 중 근태다(AttendanceItem.attendanceStatus JSDoc 참조, 도메인모델.md §근태 생성 규칙 실측) —
 * 이 경우 outline 톤의 "진행 중" 배지로 대체한다.
 */
export function getAttendanceStatusBadge(status: AttendanceStatus | null): AttendanceStatusBadgeInfo {
  if (status === null) {
    return { label: '진행 중', variant: 'outline' }
  }
  return attendanceStatusBadgeMap[status]
}
