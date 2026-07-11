/**
 * franchise 도메인 queryKey 팩토리(ROADMAP(SALES) T1.1 / §참조 계약 매핑).
 * department 도메인(departmentKeys)과 동형 구조 — all을 배열 리터럴로 고정해
 * invalidateQueries(franchiseKeys.all)로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * list의 params(keyword/status/managerId/page/size)는 검색·필터·페이징 상태가 바뀔 때마다
 * 별도 캐시 엔트리로 구분되도록 queryKey에 그대로 포함한다 — FranchisePicker(T1.2)의 담당
 * 기본뷰(managerId)↔전체 검색(keyword) 모드 전환도 이 축으로 캐시된다.
 */
export const franchiseKeys = {
  all: ['franchise'] as const,
  list: (params?: {
    keyword?: string
    status?: string
    managerId?: number
    page?: number
    size?: number
  }) => [...franchiseKeys.all, 'list', params] as const,
  /** 가맹점 상세 조회(FRANCHISE_DETAIL). */
  detail: (franchiseId: number) => [...franchiseKeys.all, 'detail', franchiseId] as const,
  /** 월 매출 조회(FRANCHISE_SALES_MONTHLY). yearMonth는 요청 경로와 동일한 `yyyy-MM` 문자열. */
  monthlySales: (franchiseId: number, yearMonth: string) =>
    [...franchiseKeys.all, 'monthlySales', franchiseId, yearMonth] as const,
  /**
   * 교육(FRANCHISE_EDUCATION_*) 서브도메인 키. 전부 [...all, 'education', ...] 아래에 묶어
   * invalidateQueries(franchiseKeys.all) 한 번으로 하위 전체가 갱신되게 한다.
   */
  education: {
    /**
     * 교육 캘린더(FRANCHISE_EDUCATION_CALENDAR). start/end는 요청 쿼리와 동일한
     * `yyyy-MM-dd'T'HH:mm:ss` 문자열(둘 다 선택 — 미입력 시 백엔드가 당월 범위로 기본 처리).
     */
    calendar: (start?: string, end?: string) =>
      [...franchiseKeys.all, 'education', 'calendar', start, end] as const,
    /** 교육 상세(FRANCHISE_EDUCATION_DETAIL). */
    detail: (educationId: number) =>
      [...franchiseKeys.all, 'education', 'detail', educationId] as const,
    /** 교육 신청자 목록(FRANCHISE_EDUCATION_APPLICANTS). 페이징 params는 list와 같은 객체 축. */
    applicants: (educationId: number, params?: { page?: number; size?: number }) =>
      [...franchiseKeys.all, 'education', 'applicants', educationId, params] as const,
  },
  /** 문의(FRANCHISE_INQUIRY_*) 서브도메인 키. education과 동형 구조. */
  inquiry: {
    /**
     * 문의 목록(FRANCHISE_INQUIRY_LIST). params 축은 query-parameters.adoc 실측
     * (전 쿼리 선택 — isAnswered/assignedManagerId/keyword/from/to/page/size).
     * from/to는 요청 쿼리와 동일한 `yyyy-MM-dd` 문자열.
     */
    list: (params?: {
      isAnswered?: boolean
      assignedManagerId?: number
      keyword?: string
      from?: string
      to?: string
      page?: number
      size?: number
    }) => [...franchiseKeys.all, 'inquiry', 'list', params] as const,
    /** 문의 상세(FRANCHISE_INQUIRY_DETAIL). */
    detail: (inquiryId: number) => [...franchiseKeys.all, 'inquiry', 'detail', inquiryId] as const,
    /** 문의 답변 조회(FRANCHISE_INQUIRY_ANSWER_DETAIL). */
    answer: (inquiryId: number) => [...franchiseKeys.all, 'inquiry', 'answer', inquiryId] as const,
  },
  /**
   * 매출(FRANCHISE_SALES_YEARLY/DAILY) 서브도메인 키.
   * 기존 monthlySales 키는 소비처(getFranchiseMonthlySales)가 있어 그대로 두고,
   * 신규 연/일 매출만 이 네임스페이스로 묶는다.
   */
  sales: {
    /** 연 매출(FRANCHISE_SALES_YEARLY). year는 요청 경로와 동일한 숫자 연도(예: 2026). */
    yearly: (franchiseId: number, year: number) =>
      [...franchiseKeys.all, 'sales', 'yearly', franchiseId, year] as const,
    /** 일 매출(FRANCHISE_SALES_DAILY). date는 요청 경로와 동일한 `yyyy-MM-dd` 문자열. */
    daily: (franchiseId: number, date: string) =>
      [...franchiseKeys.all, 'sales', 'daily', franchiseId, date] as const,
  },
}
