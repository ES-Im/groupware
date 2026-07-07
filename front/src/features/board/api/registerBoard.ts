import { apiClient } from '@/shared/api/client'

/**
 * 게시글 등록 요청 페이로드(`BOARD_REGISTER`, request-fields.adoc 실측 기준(추측 금지)).
 * `publishedAt`을 생략하면 임시저장, 포함하면 즉시 발행으로 분기한다(§참조 계약 매핑).
 */
export interface RegisterBoardPayload {
  categoryId: number
  title: string
  content: string
  publishedAt?: string
}

/**
 * 게시글 등록(`BOARD_REGISTER`, api-endpoint.md 기능ID `BOARD_REGISTER` →
 * `POST /api/boards`, minRole EMPLOYEE(활성 사원)).
 * 성공 시 `201 Created`·응답 본문 없음(response-body.adoc 실측 — boardId 미반환).
 * **설계 확정(PRD §해결됨)**: 등록 직후 boardId를 얻을 수 없어 상세로 자동 이동할 수 없다 —
 * 첨부가 필요한 글은 임시저장 → "임시저장글 불러오기"(F308 재사용)에서 사용자가 직접 선택해
 * 이어간다. 이 함수는 boardId를 추정하지 않는다.
 */
export async function registerBoard(payload: RegisterBoardPayload): Promise<void> {
  await apiClient.post('/api/boards', payload)
}
