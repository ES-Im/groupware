/**
 * 카테고리별 게시글 목록 조회(`BOARD_LIST`, GET /api/categories/{categoryId}/boards) 응답 타입.
 * 필드는 back/build/generated-snippets/BOARD_LIST/response-fields.adoc 실측 기준(추측 금지).
 * 서버는 발행 글만 반환한다(§참조 계약 매핑).
 */
export interface BoardSummary {
  boardId: number
  boardTitle: string
  authorName: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  isFileAttached: boolean
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외).
 * department 도메인의 `Page<T>`(features/department/model/deptMember.ts)와 동형이며,
 * 도메인마다 독립 정의하는 기존 컨벤션을 그대로 따른다(공유 제네릭 승격은 이번 태스크 범위 밖).
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

/** `BOARD_LIST` 응답 전체. */
export type BoardListPage = Page<BoardSummary>

/**
 * 게시글 상세 조회(`BOARD_DETAIL`, GET /api/boards/{boardId}) 응답 타입.
 * 필드는 back/build/generated-snippets/BOARD_DETAIL/response-fields.adoc 실측 기준(추측 금지).
 * 진입 시 서버가 조회수(viewCount)를 증가시킨다(§참조 계약 매핑) — 프론트는 클라 낙관적 갱신 없이
 * 이 응답을 그대로 신뢰하고, 재조회 시에만 최신 viewCount를 반영한다.
 * empId(작성자 사원 식별 번호)는 T11.3의 작성자 액션 게이팅(수정/발행 버튼 노출)의 소스로 쓰인다.
 */
export interface BoardDetailResponse {
  boardId: number
  categoryId: number
  empId: number
  authorName: string
  title: string
  content: string
  publishedAt: string
  modifiedAt: string
  likeCount: number
  viewCount: number
  commentCount: number
  isDraft: boolean
  /** 로그인 사용자의 좋아요 여부. 서버가 empId 기준 BoardLike 존재(exists)로 판별해 내려준다. */
  isLiked: boolean
}

/**
 * 게시글 첨부파일 목록 조회(`BOARD_FILES`, GET /api/boards/{boardId}/files) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/BOARD_FILES/response-fields.adoc 실측 기준(추측 금지).
 */
export interface BoardFileInfo {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

/**
 * 내 임시저장 게시글 목록 조회(`BOARD_DRAFTS`, GET /api/my/boards/drafts) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/BOARD_DRAFTS/response-fields.adoc 실측 기준(추측 금지).
 * 작성자 본인의 임시저장 글만 반환한다(§참조 계약 매핑). 게시글 작성 페이지의
 * "임시저장글 불러오기" 토글(F308 재사용)에서도 동일 타입을 그대로 소비한다.
 */
export interface BoardDraftSummary {
  boardId: number
  title: string
  updatedAt: string
}

/**
 * 게시글 편집 초기값 조회(`BOARD_EDIT_MODE`, GET /api/boards/{boardId}/edit-mode) 응답 타입.
 * 필드는 back/build/generated-snippets/BOARD_EDIT_MODE/response-fields.adoc 실측 기준(추측 금지).
 * 권한=게시글 작성자(§참조 계약 매핑) — 소유권 위반 시 서버가 403을 반환한다.
 */
export interface BoardEditModeResponse {
  boardId: number
  categoryId: number
  title: string
  content: string
}

/**
 * 게시글 수정(`BOARD_UPDATE`, PATCH /api/boards/{boardId}) 요청 타입.
 * 필드는 back/build/generated-snippets/BOARD_UPDATE/request-fields.adoc 실측 기준(추측 금지) —
 * categoryId/title/content는 전부 optional(변경 필드만 전송)이며 modifiedAt만 required(수정 시각,
 * BoardDetailResponse.modifiedAt/BoardEditModeResponse 조회 시점의 값을 그대로 되돌려 보낸다).
 */
export interface BoardUpdateRequest {
  categoryId?: number
  title?: string
  content?: string
  modifiedAt: string
}

/**
 * 댓글 목록 조회(`BOARD_COMMENTS`, GET /api/boards/{boardId}/comments) 응답 항목 타입.
 * 필드는 back/build/generated-snippets/BOARD_COMMENTS/response-fields.adoc 실측 기준(추측 금지).
 *
 * `parentCommentId`는 최상위 댓글이면 `null`이다(1-depth 대댓글만 부모를 가진다 — 백엔드
 * `BoardCommentResponse` 레코드의 `@Nullable Long parentCommentId` 실측, back/src/main/java/
 * com/haruon/groupware/application/board/service/query/dto/BoardCommentResponse.java).
 * `isDeleted=true`(소프트 삭제, F317)면 같은 레코드의 compact 생성자가 `writerEmpId`/
 * `writerEmpName`/`content`/`registerAt`/`isEdited`를 전부 `null`로 되돌린다 — 화면은 이 경우
 * 원 내용 대신 "삭제된 댓글입니다."만 표시해야 한다(T14.2에서 소비, 여기서는 타입만 정확히
 * 반영한다).
 */
export interface BoardComment {
  parentCommentId: number | null
  commentId: number
  writerEmpId: number | null
  writerEmpName: string | null
  content: string | null
  registerAt: string | null
  isEdited: boolean | null
  isDeleted: boolean
}

/** `BOARD_COMMENTS` 응답 전체. */
export type BoardCommentPage = Page<BoardComment>

/**
 * 댓글 등록/대댓글 등록/수정 공용 요청 타입(`COMMENT_REGISTER`/`COMMENT_REPLY`/`COMMENT_UPDATE`,
 * request-fields.adoc 3종 실측 기준 — content 단일 필드로 완전히 동일하다, 추측 금지).
 * 서버 제약: 300자 이하·공백 불가(폼 단계 zod 검증은 T14.2에서 이 제약을 그대로 구현한다).
 */
export interface CommentPayload {
  content: string
}
