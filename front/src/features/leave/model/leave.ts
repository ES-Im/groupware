/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
 * attendance/department 도메인의 Page<T>와 동형이며, 도메인마다 독립 정의하는 기존 컨벤션을
 * 그대로 따른다(공유 제네릭 승격은 이번 태스크 범위 밖).
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

/**
 * 연차/특별/포상 휴가 부여·사용 요약(`EMP_LEAVE_SUMMARY`/`DEPT_EMP_LEAVE_SUMMARY`/
 * `MY_EMP_LEAVE_SUMMARY` 공통 하위 구조, response-fields.adoc 실측 기준).
 */
export interface LeaveSummary {
  annualBaseGrantDays: number
  annualUsedDays: number
  specialGrantDays: number
  specialUsedDays: number
  compensatoryGrantDays: number
  compensatoryUsedDays: number
}

/**
 * `EMP_LEAVE_SUMMARY`(F747) 응답 content[] 1건. empId가 맨 앞 필드로 포함되어(PRD §계약 실측
 * 메모 "요약 응답 empId 실측 확인") 이 행에서 곧바로 F749/F750 조정 호출의 empId path param으로
 * 쓸 수 있다(별도 사원 검색 불필요).
 */
export interface EmpLeaveSummaryRow {
  empId: number
  empNo: string
  empName: string
  deptName: string
  positionName: string
  leaveSummary: LeaveSummary
}

export type EmpLeaveSummaryPage = Page<EmpLeaveSummaryRow>

/** `EMP_LEAVE_USAGE_SUMMARY`(F748) 응답(단일 값). */
export interface LeaveUsageSummary {
  annualLeaveUsagePercent: number
}

/**
 * 부여일수 조정 다이얼로그(T5.3) 대상. `leaveKind`가 특별/포상 어느 축을 조정하는지 결정하며,
 * 다이얼로그는 이 값으로 F749(`useAdjustSpecialGrantDaysMutation`)/F750
 * (`useAdjustCompensatoryGrantDaysMutation`) 중 호출할 mutation을 고른다(신규 selector UI 없음 —
 * 요약 표 행의 [특별 조정]/[포상 조정] 버튼이 이미 종류를 확정해 전달).
 */
export interface AdjustGrantDaysTarget {
  empId: number
  empName: string
  leaveKind: 'SPECIAL' | 'COMPENSATORY'
}
