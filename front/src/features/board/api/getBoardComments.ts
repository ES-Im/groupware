import { apiClient } from '@/shared/api/client'
import type { BoardCommentPage } from '../model/board'

/**
 * 게시글 댓글 목록 조회(`BOARD_COMMENTS`, api-endpoint.md 기능ID `BOARD_COMMENTS` →
 * `GET /api/boards/{boardId}/comments`, minRole EMPLOYEE).
 *
 * path boardId는 필수다. page/size 쿼리 파라미터는 모두 선택값이며, 값이 없으면 쿼리스트링
 * 자체에서 생략한다(getBoardList와 동일 패턴 — department 도메인 getDepartmentMembers/
 * getDepartments 계열의 조건부 params 구성 컨벤션).
 */
export async function getBoardComments(
  boardId: number,
  params?: { page?: number; size?: number },
): Promise<BoardCommentPage> {
  const query: Record<string, number> = {}
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<BoardCommentPage>(`/api/boards/${boardId}/comments`, {
    params: query,
  })
  return data
}
