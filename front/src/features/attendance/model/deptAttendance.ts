import type { AttendanceItem, Page } from './attendance'

/**
 * 부서 근태 화면(F305/F306) 공통 사원 정보 블록.
 * 필드는 back/build/generated-snippets/DEPT_ATTENDANCE_MONTHLY(및 _PENDING)/response-fields.adoc
 * `content[].empInfo.*` 실측 기준(추측 금지).
 */
export interface DeptAttendanceEmpInfo {
  empId: number
  empNo: string
  empName: string
  deptName: string
  positionName: string
}

/**
 * 부서 사원 1인의 월별 근태 요약 카운트.
 * 필드는 back/build/generated-snippets/DEPT_ATTENDANCE_MONTHLY/response-fields.adoc
 * `content[].summary.*` 실측 기준(추측 금지). MyAttendanceSummary(F304, 내 근태 요약 단일 객체)와
 * 필드 형태가 우연히 같지만 응답 주체(부서 사원별 vs 나 1인)가 달라 별도 타입으로 선언한다.
 */
export interface AttendanceSummaryCounts {
  approvedAttendanceCount: number
  pendingAttendanceCount: number
  totalAttendanceCount: number
  overtimeMinutes: number
}

/**
 * `DEPT_ATTENDANCE_MONTHLY`(F305) 응답의 `content[]` 원소 1건.
 * attendanceInfo가 **배열**(사원별 해당 월 근태 상세 목록)인 점이 {@link DeptPendingRow}와의 핵심 차이
 * (front/docs/prd/5.attendance-prd.md §참조 계약 매핑). AttendanceItem은 T1.1(attendance.ts) 재사용,
 * 재선언하지 않는다.
 */
export interface DeptAttendanceRow {
  empInfo: DeptAttendanceEmpInfo
  summary: AttendanceSummaryCounts
  attendanceInfo: AttendanceItem[]
}

/**
 * `DEPT_ATTENDANCE_PENDING`(F306) 응답의 `content[]` 원소 1건.
 * attendanceInfo가 **단건 객체**(승인 대기 근태 1건)인 점이 {@link DeptAttendanceRow}와의 핵심 차이이며
 * summary 블록 자체가 없다(back/build/generated-snippets/DEPT_ATTENDANCE_PENDING/response-fields.adoc 실측).
 */
export interface DeptPendingRow {
  empInfo: DeptAttendanceEmpInfo
  attendanceInfo: AttendanceItem
}

/** `DEPT_ATTENDANCE_MONTHLY`(F305) 응답 전체(Page 래핑). */
export type DeptAttendanceMonthly = Page<DeptAttendanceRow>

/** `DEPT_ATTENDANCE_PENDING`(F306) 응답 전체(Page 래핑). */
export type DeptAttendancePending = Page<DeptPendingRow>

/**
 * [수정] 버튼 클릭으로 `UpdateAttendanceDialog`(ROADMAP2 T4.3, F307)에 주입되는 대상 근태 1건.
 * `DeptAttendanceRow.attendanceInfo[]` 원소(탭①, 월별)·`DeptPendingRow.attendanceInfo` 단건(탭②,
 * 승인대기) 양쪽에서 동일한 형태로 파생해 넘긴다 — 두 표 컴포넌트가 공유하는 콜백 페이로드라 이
 * 도메인 모델 계층에 선언한다(컴포넌트 간 타입 임포트 방지).
 */
export interface AttendanceEditTarget {
  targetEmpId: number
  attendanceId: number
  startAt: string | null
  endAt: string | null
}
