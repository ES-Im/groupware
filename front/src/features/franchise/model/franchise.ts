/**
 * franchise 도메인 모델 타입(ROADMAP(FRANCHISE) T1.1).
 * 모든 필드는 back/build/generated-snippets/<기능ID>/ 스니펫 실측 기준(추측 금지).
 */

/**
 * 가맹점 목록 1건.
 * `BusinessStatus`는 백엔드 응답 JSON 키 그대로(대문자 시작)다 — 다른 필드와 달리 camelCase가
 * 아니므로 임의로 고치지 않는다(response-body.adoc 실측: `"BusinessStatus":"정상 영업 중"`).
 */
export interface Franchise {
  id: number
  name: string
  address: string
  ownerName: string
  BusinessStatus: string
  managerEmpId: number
  managerEmpName: string
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
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

export type FranchisesPage = Page<Franchise>

/**
 * 가맹점 담당자/답변 담당 배정 후보 사원 1건(`FRANCHISE_ASSIGNABLE_MANAGERS`).
 * 배정 UI(FranchiseManagerPicker)에서 FRANCHISE 권한 사원만 후보로 노출하기 위한 경량 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_ASSIGNABLE_MANAGERS/response-fields.adoc 실측 기준(배열 루트).
 */
export interface AssignableManager {
  empId: number
  empName: string
}

/**
 * 영업 상태(BusinessStatus) enum 코드 5종(백엔드 BusinessStatus.java 실측,
 * PRD §참조 계약 매핑 P2 영업상태 변경 행 — Open Q#2 해소 근거).
 * 목록 필터·영업상태 변경(FRANCHISE_STATUS_UPDATE)의 `status` 파라미터로 전송하는 값이다.
 */
export const BUSINESS_STATUS_CODES = [
  'OPEN',
  'CLOSED',
  'PRE_OPEN',
  'TEMP_CLOSED',
  'READY_TO_OPEN',
] as const

export type BusinessStatusCode = (typeof BUSINESS_STATUS_CODES)[number]

/**
 * BusinessStatus enum 코드 → 한글 표시명 매핑.
 * label은 **백엔드 enum description 그대로**다(조회 응답의 `BusinessStatus` 표시명과
 * 정확히 일치해야 역매핑이 성립). 조회(FRANCHISE_LIST/DETAIL)는 표시명 문자열,
 * 전송(상태변경·목록 필터)은 enum 코드 — 두 축을 혼용하지 않는다.
 */
export const BUSINESS_STATUS_LABEL: Record<BusinessStatusCode, string> = {
  OPEN: '정상 영업 중',
  CLOSED: '폐업',
  PRE_OPEN: '가오픈',
  TEMP_CLOSED: '일시 영업 중단',
  READY_TO_OPEN: '영업 준비 상태',
}

/** 표시명 → 코드 역매핑. BUSINESS_STATUS_LABEL에서 파생해 단일 원천을 유지한다. */
const BUSINESS_STATUS_BY_LABEL: Record<string, BusinessStatusCode> = Object.fromEntries(
  BUSINESS_STATUS_CODES.map((code) => [BUSINESS_STATUS_LABEL[code], code]),
)

/**
 * 조회 응답의 표시명 문자열(`BusinessStatus`)을 enum 코드로 되돌린다.
 * 계약 밖 값이면 undefined(코드 발명 금지 — 호출부가 방어 처리).
 */
export function resolveBusinessStatusCode(displayName: string): BusinessStatusCode | undefined {
  return BUSINESS_STATUS_BY_LABEL[displayName]
}

/**
 * 가맹점 상세 조회(`FRANCHISE_DETAIL`) 응답 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_DETAIL/response-fields.adoc 실측 기준(추측 금지).
 * `BusinessStatus`는 목록(Franchise)과 동일하게 응답 JSON 키가 대문자 시작 그대로이며
 * 값은 한글 표시명 문자열이다.
 */
export interface FranchiseDetail {
  id: number
  name: string
  address: string
  ownerName: string
  businessNumber: string
  contactNumber: string
  contactEmail: string
  BusinessStatus: string
  memo: string
  managerEmpId: number
  managerEmpName: string
}

/**
 * 가맹점 등록(`FRANCHISE_CREATE`) 요청 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_CREATE/request-fields.adoc 실측 기준(추측 금지).
 * 목록/상세 응답의 `name`과 달리 요청 키는 `franchiseName`이다(계약 그대로 — 임의 통일 금지).
 */
export interface FranchiseCreateRequest {
  businessNumber: string
  franchiseName: string
  address: string
  ownerName: string
  contactNumber: string
  contactEmail: string
  /** 담당 사원 식별 번호(선택 — request-fields.adoc: 미입력 가능). */
  managerEmpId?: number
}

/**
 * 가맹점 등록(`FRANCHISE_CREATE`) 응답 타입.
 * ⚠️ 식별자 키가 목록/상세는 `id`, 생성 응답은 `franchiseId`로 상이하다(PRD §참조 계약 매핑).
 */
export interface FranchiseCreateResponse {
  franchiseId: number
}

/**
 * 교육 캘린더 조회(`FRANCHISE_EDUCATION_CALENDAR`) 응답 항목 타입(루트가 배열).
 * 필드는 back/build/generated-snippets/FRANCHISE_EDUCATION_CALENDAR/response-fields.adoc 실측 기준(추측 금지).
 * date는 `yyyy-MM-dd` 문자열(response-body.adoc 실측: "2026-05-01").
 */
export interface FranchiseEducationCalendarItem {
  id: number
  date: string
  place: string
  title: string
  isFull: boolean
  isActive: boolean
}

/**
 * 교육 첨부 파일 1건.
 * ⚠️ Open Q#3 미해소: FRANCHISE_EDUCATION_DETAIL 스니펫의 fileListInfoList는 Null 예시만 있어
 * 항목 shape 실측이 불가하다. board/meeting 표준 FileListInfo
 * {fileId, originalName, extension, fileSize}(BOARD_FILES response-fields.adoc 실측과 동일 구조)
 * **가정**으로 정의한다 — 첨부 있는 교육 더미데이터로 런타임 재확인 필요(T4.3·T4.5 재검증 대상).
 */
export interface FranchiseEducationFileInfo {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

/**
 * 교육 상세 조회(`FRANCHISE_EDUCATION_DETAIL`) 응답 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_EDUCATION_DETAIL/response-fields.adoc 실측 기준(추측 금지).
 * date는 `yyyy-MM-dd`, startAt은 `HH:mm:ss` 문자열(response-body.adoc 실측).
 * fileListInfoList는 스니펫 실측상 null이 내려올 수 있다(첨부 없음 케이스).
 */
export interface FranchiseEducationDetail {
  id: number
  date: string
  startAt: string
  place: string
  title: string
  content: string
  appliedCount: number
  capacity: number
  remainingCapacity: number
  isActive: boolean
  fileListInfoList: FranchiseEducationFileInfo[] | null
}

/**
 * 교육 신청자 목록 조회(`FRANCHISE_EDUCATION_APPLICANTS`) 응답의 신청자 1건.
 * 필드는 back/build/generated-snippets/FRANCHISE_EDUCATION_APPLICANTS/response-fields.adoc 실측 기준(추측 금지).
 * appliedAt은 `yyyy-MM-dd'T'HH:mm:ss` 문자열.
 */
export interface FranchiseEducationApplicant {
  applicationId: number
  externalId: string
  franchiseId: number
  franchiseName: string
  contactNumber: string
  contactEmail: string
  appliedCount: number
  appliedAt: string
}

export type FranchiseEducationApplicantsPage = Page<FranchiseEducationApplicant>

/**
 * 교육 등록(`FRANCHISE_EDUCATION_CREATE`) 요청 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_EDUCATION_CREATE/request-fields.adoc 실측 기준(추측 금지).
 * 요청은 일시를 `educationDate` 하나(`yyyy-MM-dd'T'HH:mm:ss`)로 받지만 조회 응답은
 * date/startAt 둘로 쪼개 내려준다 — 키 이름·형식을 임의 통일하지 않는다.
 */
export interface FranchiseEducationCreateRequest {
  educationDate: string
  place: string
  title: string
  content: string
  /** 정원(양수). */
  capacity: number
}

/** 교육 등록(`FRANCHISE_EDUCATION_CREATE`) 응답 타입. */
export interface FranchiseEducationCreateResponse {
  educationId: number
}

/**
 * 문의 목록 조회(`FRANCHISE_INQUIRY_LIST`) 응답의 문의 1건.
 * 필드는 back/build/generated-snippets/FRANCHISE_INQUIRY_LIST/response-fields.adoc 실측 기준(추측 금지).
 * inquiryAt은 `yyyy-MM-dd'T'HH:mm:ss` 문자열. isDeleted는 "삭제 요청 여부"다(이미 삭제됨이 아님).
 * assignedManagerId/assignedManagerName은 담당 사원이 없는 가맹점에서 생성된 문의라면 null일 수
 * 있다(도메인모델.md 실측: "가맹점에 담당 사원이 없으면 문의는 담당자 없이 생성될 수 있다", T5.4).
 */
export interface FranchiseInquiry {
  inquiryId: number
  externalId: string
  franchiseId: number
  franchiseName: string
  inquiryTitle: string
  inquiryAt: string
  isAnswered: boolean
  assignedManagerId: number | null
  assignedManagerName: string | null
  isDeleted: boolean
}

export type FranchiseInquiriesPage = Page<FranchiseInquiry>

/**
 * 문의 상세 조회(`FRANCHISE_INQUIRY_DETAIL`) 응답 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_INQUIRY_DETAIL/response-fields.adoc 실측 기준(추측 금지).
 * 목록과 달리 isAnswered가 없고 inquirerContact·inquiryContent가 추가된다.
 * assignedManagerId/assignedManagerName은 목록과 동일하게 담당자 미배정 시 null일 수 있다(T5.4 —
 * 담당자 배정 유도 분기가 이 null 여부로 판정된다).
 */
export interface FranchiseInquiryDetail {
  inquiryId: number
  externalId: string
  franchiseId: number
  franchiseName: string
  inquirerContact: string
  inquiryAt: string
  inquiryTitle: string
  inquiryContent: string
  assignedManagerId: number | null
  assignedManagerName: string | null
  isDeleted: boolean
}

/**
 * 문의 답변 조회(`FRANCHISE_INQUIRY_ANSWER_DETAIL`) 응답 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_INQUIRY_ANSWER_DETAIL/response-fields.adoc 실측 기준(추측 금지).
 * 답변 미작성 시 404/빈 바디 여부(Open Q#5)는 미해소 — 이 타입은 응답이 존재할 때의 shape만
 * 정의하며, 미작성 분기 처리는 소비처(T5.2)가 담당한다.
 */
export interface FranchiseInquiryAnswer {
  answerId: number
  content: string
  isSubmitted: boolean
  answeredAt: string
  answeredEmpId: number
  answeredEmpName: string
}

/**
 * 연 매출 조회(`FRANCHISE_SALES_YEARLY`) 응답의 월별 매출 포인트 1건.
 * salesMonth는 `yyyyMM` 숫자(예: 202605). 월 매출 내부용 FranchiseDailySalesPoint(salesDate
 * 숫자)와 별개 타입이다 — 축 필드가 달라 통합하지 않는다.
 */
export interface FranchiseMonthlySalesPoint {
  salesMonth: number
  salesAmount: number
  orderCount: number
}

/**
 * 연 매출 조회(`FRANCHISE_SALES_YEARLY`) 응답 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_SALES_YEARLY/response-fields.adoc 실측 기준(추측 금지).
 * averageSalesAmount/averageOrderAmount는 "연 일평균"이다(월평균 아님 — 필드 설명 실측).
 */
export interface FranchiseYearlySales {
  franchiseId: number
  franchiseName: string
  salesYear: number
  totalSalesAmount: number
  totalOrderCount: number
  averageSalesAmount: number
  averageOrderAmount: number
  salesMonths: number
  monthlySales: FranchiseMonthlySalesPoint[]
}

/**
 * 일 매출 조회(`FRANCHISE_SALES_DAILY`) 응답 타입(단건).
 * 필드는 back/build/generated-snippets/FRANCHISE_SALES_DAILY/response-fields.adoc 실측 기준(추측 금지).
 * ⚠️ salesDate는 `yyyy-MM-dd` **문자열**이다 — 연/월 매출의 salesMonth(yyyyMM 숫자)·
 * FranchiseDailySalesPoint.salesDate(yyyyMMdd 숫자)와 타입이 다르므로 혼동/통합 금지.
 */
export interface FranchiseDailySales {
  franchiseId: number
  franchiseName: string
  salesDate: string
  salesAmount: number
  orderCount: number
}

/**
 * 월 매출 조회(`FRANCHISE_SALES_MONTHLY`) 응답의 일별 매출 포인트 1건.
 * salesDate는 `yyyyMMdd` 숫자다(response-fields.adoc 실측 — 문자열 아님).
 */
export interface FranchiseDailySalesPoint {
  salesDate: number
  salesAmount: number
  orderCount: number
}

/**
 * 월 매출 조회(`FRANCHISE_SALES_MONTHLY`) 응답 타입.
 * 필드는 back/build/generated-snippets/FRANCHISE_SALES_MONTHLY/response-fields.adoc 실측 기준(추측 금지).
 * salesMonth는 `yyyyMM` 숫자(예: 202605)로 내려온다 — 요청 경로의 `yyyy-MM`과 형식이 다르므로 주의.
 */
export interface FranchiseMonthlySales {
  franchiseId: number
  franchiseName: string
  salesMonth: number
  totalSalesAmount: number
  totalOrderCount: number
  averageOrderAmount: number
  averageDailySalesAmount: number
  salesDays: number
  dailySales: FranchiseDailySalesPoint[]
}
