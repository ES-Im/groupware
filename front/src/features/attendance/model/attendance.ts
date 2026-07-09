/**
 * 근태 상태 코드(도메인모델 실측, `back/build/generated-snippets/MY_ATTENDANCE_MONTHLY/response-fields.adoc`
 * `content[].attendanceStatus`는 String이라 서버가 아래 6개 리터럴 중 하나를 내려준다, 추측 금지).
 * 시간 필수 상태 = NORMAL/LATE_EARLY/HALF_DAY_LEAVE, 시간 없음 상태 = ALL_DAY_LEAVE/SICK_LEAVE/ABSENT
 * (이 경우 AttendanceItem.startAt/endAt이 null일 수 있다 — front/docs/prd/5.attendance-prd.md §참조 계약 매핑).
 */
export type AttendanceStatus =
  | 'NORMAL'
  | 'LATE_EARLY'
  | 'HALF_DAY_LEAVE'
  | 'ALL_DAY_LEAVE'
  | 'SICK_LEAVE'
  | 'ABSENT'

/**
 * 근태 1건 공통 타입(`MY_ATTENDANCE_MONTHLY`·`DEPT_ATTENDANCE_MONTHLY`·`DEPT_ATTENDANCE_PENDING`가
 * 공유, front/docs/prd/5.attendance-prd.md §참조 계약 매핑 "공통 타입 AttendanceItem" 절).
 * 필드는 back/build/generated-snippets/MY_ATTENDANCE_MONTHLY/response-fields.adoc 실측 기준(추측 금지).
 *
 * attendanceId는 백엔드 최근 수정으로 추가된 필드(Open Question #1 해결 — QueryDSL 프로젝션에
 * qAttendance.id 반영)이며, 부서 근태 수정(`DEPT_ATTENDANCE_UPDATE`)/승인(`DEPT_ATTENDANCE_APPROVE`)의
 * path 파라미터로 그대로 재사용된다.
 * draftId는 연동 기안서(전자결재 도메인) 식별 번호로 표시 전용 참조이며, 연동 기안서가 없으면 null이다.
 */
export interface AttendanceItem {
  attendanceId: number
  attendanceStatus: AttendanceStatus
  attendanceDate: string
  startAt: string | null
  endAt: string | null
  isApproved: boolean
  draftId: number | null
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
 * board/department 도메인의 Page<T>와 동형이며, 도메인마다 독립 정의하는 기존 컨벤션을 그대로 따른다
 * (공유 제네릭 승격은 이번 태스크 범위 밖).
 */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

/** `MY_ATTENDANCE_MONTHLY`(F303) 응답 전체. */
export type MyAttendance = Page<AttendanceItem>

/**
 * 내 월별 근태 요약(`MY_ATTENDANCE_MONTHLY_SUMMARY`, F304) 응답 타입.
 * 필드는 back/build/generated-snippets/MY_ATTENDANCE_MONTHLY_SUMMARY/response-fields.adoc
 * 실측 기준(추측 금지). 배열이 아닌 단일 객체다.
 */
export interface MyAttendanceSummary {
  approvedAttendanceCount: number
  pendingAttendanceCount: number
  totalAttendanceCount: number
  overtimeMinutes: number
}
