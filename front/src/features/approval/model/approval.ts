/**
 * 결재 상태 코드(도메인모델 실측, `back/src/main/java/.../domain/draft/sub/ApprovalStatus.java`).
 * 서버는 목록/상세 응답의 `approvalStatus`를 **표시명 문자열**(enum description)로 내려주지
 * 이 코드 자체를 내려주지 않는다(추측 금지):
 *   UNSUBMITTED→"미상신" · WAITING→"결재대기" · IN_PROGRESS→"결재진행중" ·
 *   APPROVED→"결재완료" · REJECTED→"반려".
 * 표시명↔코드 대응은 `lib/approvalStatusBadge.ts`가 담당한다(T1.3). 이 union은 이후 슬라이스
 * (M3 결재자 액션·M4 기안자 액션의 상태 파생 로직)가 코드 기준으로 분기할 때 재사용하는 기반이다.
 * 상태 전이: (UNSUBMITTED →) WAITING → IN_PROGRESS → APPROVED / WAITING·IN_PROGRESS → REJECTED.
 */
export type ApprovalStatus =
  | 'UNSUBMITTED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'

/**
 * 4종 문서함(상신함 F712·임시저장함 F713·결재대기함 F710·결재함 F714) 공통 목록 행 타입.
 * 4종 모두 동일 구조를 공유하므로 단일 `DocumentBoxTable`을 재사용한다(§참조 계약 매핑 "공용 행").
 * 필드는 `back/build/generated-snippets/MY_SUBMITTED_DRAFTS/response-fields.adoc` 등 4종 스니펫
 * 실측 기준(추측 금지, 4종 response-fields가 동일).
 *
 * - submittedAt: 상신일시 `yyyy-MM-dd'T'HH:mm:ss`. 미상신(임시저장) 문서는 null이다.
 * - latestApproverName: 마지막 처리 결재자 이름. 없으면 null.
 * - approvalStatus: **결재 상태 표시명 문자열**(예 "결재완료")로 내려온다 — ApprovalStatus 코드가
 *   아니다. 배지 렌더는 lib/approvalStatusBadge.ts의 표시명 기준 헬퍼로 처리한다(T1.3).
 * - **`draftType` 없음**: 목록 응답에는 기안 유형이 포함되지 않아 목록 단계에서는 유형 식별/필터가
 *   불가하다(Open Q#7 — 유형 뱃지 미표시, 상세 진입 후 분기). 제목/기안자만으로 식별한다.
 */
export interface DocumentBoxRow {
  draftId: number
  drafterName: string
  draftTitle: string
  submittedAt: string | null
  latestApproverName: string | null
  isFileAttached: boolean
  approvalStatus: string
}

/**
 * 4종 문서함 목록 조회 공통 쿼리 파라미터(4종 스니펫 query-parameters.adoc 실측: 전부 optional).
 * queryKey 팩토리(queryKeys.ts)·API 함수(api/)·목록 표(DocumentBoxTable)가 공유한다.
 */
export interface DocumentBoxQueryParams {
  keyword?: string
  page?: number
  size?: number
}

/**
 * 문서함 요약(`MY_DOCUMENT_BOX_SUMMARY`, F715) 응답 타입.
 * 필드는 back/build/generated-snippets/MY_DOCUMENT_BOX_SUMMARY/response-fields.adoc 실측 기준(추측 금지).
 * 배열이 아닌 단일 객체다(Page 아님). 문서함 홈(DocumentBoxHomePage) 요약 카드 4종이 소비한다.
 *
 * pendingApprovalDraftCount는 결재대기 건수 뱃지(F711, MY_PENDING_APPROVAL_DRAFTS_COUNT)와 동일 축의
 * 값이다 — 홈 카드는 이 요약값을, 사이드바 뱃지는 F711 단건 조회를 각각 소비한다(중복 호출 회피).
 */
export interface MyDocumentBoxSummary {
  pendingApprovalDraftCount: number
  unsubmittedDraftCount: number
  submittedDraftCount: number
  accessibleDocumentCount: number
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
 * board/attendance 도메인의 Page<T>와 동형이며, 도메인마다 독립 정의하는 기존 컨벤션을 그대로 따른다
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
