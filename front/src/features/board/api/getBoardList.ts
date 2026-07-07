import { apiClient } from '@/shared/api/client'
import type { BoardListPage } from '../model/board'

/**
 * 카테고리별 발행 게시글 목록 조회(`BOARD_LIST`, api-endpoint.md 기능ID `BOARD_LIST` →
 * `GET /api/categories/{categoryId}/boards`, minRole EMPLOYEE).
 *
 * path categoryId는 필수다(전체 게시글 목록 엔드포인트는 없다 — 카테고리 하위로만 조회 가능,
 * §참조 계약 매핑). keyword/page/size 쿼리 파라미터는 모두 선택값이다(query-parameters.adoc
 * 실측). 값이 없는 파라미터는 쿼리스트링 자체에서 생략되도록 params 객체에 조건부로만 채운다
 * (department 도메인 getDepartmentMembers/getDepartments와 동일 패턴).
 */
export async function getBoardList(
  categoryId: number,
  params?: { keyword?: string; page?: number; size?: number },
): Promise<BoardListPage> {
  const query: Record<string, string | number> = {}
  if (params?.keyword) {
    query.keyword = params.keyword
  }
  if (params?.page != null) {
    query.page = params.page
  }
  if (params?.size != null) {
    query.size = params.size
  }
  const { data } = await apiClient.get<BoardListPage>(`/api/categories/${categoryId}/boards`, {
    params: query,
  })
  return data
}
