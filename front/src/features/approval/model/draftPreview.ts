/**
 * 기안서 작성 화면의 "기안서 미리보기" → 인쇄 미리보기 새 창(`/approval/drafts/preview`) 핸드오프
 * 계약. 아직 draftId가 없는(생성 전) 폼 입력값을 새 창에 넘기기 위해 **localStorage**에 이 payload를
 * 적재한 뒤 새 창을 열고, 새 창은 마운트 시 동일 키로 읽어들인다.
 *
 * sessionStorage가 아닌 localStorage를 쓰는 이유: 새 창을 `noopener`로 열면 브라우징 컨텍스트
 * 그룹이 분리되어 브라우저가 sessionStorage 사본을 새 창에 넘겨주지 않는다 — sessionStorage
 * 핸드오프는 새 창에서 항상 빈 값이 된다. localStorage는 같은 오리진 전체가 공유하므로 noopener와
 * 무관하게 전달되고, 미리보기 창을 새로고침해도 유지된다(query-string 대신 스토리지를 쓰는 이유:
 * URL 길이 제한 회피. 값은 다음 미리보기 클릭 때 덮어쓴다).
 */

/** 미리보기 한 줄(라벨 + 값). 값이 비면 "-"로 대체 표기한다(소비 측 책임). */
export interface DraftPreviewField {
  label: string
  value: string
}

/**
 * 결재선 1인(미리보기 전용 — 순서는 배열 순서 그대로). role은 서버 enum 이름
 * (APPROVER/COOPERATOR — 라벨 변환은 getApprovalRoleLabel). localStorage 경계라 string으로
 * 열어두고, 소비 측이 누락(계약 개정 전 잔존 payload)을 APPROVER로 정규화한다.
 */
export interface DraftPreviewApprover {
  empId: number
  empName: string
  role: string
}

/** 공람 예정자 1인(작성 화면 로컬 선택분 — 생성 후 F707로 지정 예정, 표시 전용). */
export interface DraftPreviewCirculation {
  empId: number
  empName: string
}

/** sessionStorage에 적재하는 페이로드 전체(기안서 작성 4종 페이지 공용). */
export interface DraftPrintPreviewPayload {
  /** 기안서 타입명(예: 일반기안서) — 기안문 표의 "문서종류" 칸에 표기. */
  typeLabel: string
  /** 제목(기안문 표의 "제목" 칸 전용 — fields에 중복으로 넣지 않는다). */
  title: string
  /** 기안 내용(기안문 본문 영역 전용 — fields에 중복으로 넣지 않는다). */
  content: string
  /** 유형별 부가 필드(기안문 본문의 상세 표 — GENERAL은 빈 배열). */
  fields: DraftPreviewField[]
  approvers: DraftPreviewApprover[]
  /** 공람 예정자 목록(작성 화면 로컬 선택분 — 생성 성공 후 addCirculation으로 지정). */
  circulations: DraftPreviewCirculation[]
  /** 첨부 예정 파일명 목록(작성 화면 로컬 선택분 — 아직 서버 업로드 전, 표시 전용). */
  attachments: string[]
}

/** localStorage 키. 다른 도메인 키와 충돌하지 않도록 접두사를 둔다. */
export const DRAFT_PRINT_PREVIEW_STORAGE_KEY = 'haruon:draft-print-preview'
