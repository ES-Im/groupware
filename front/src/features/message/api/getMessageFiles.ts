import { apiClient } from '@/shared/api/client'
import type { FileListInfo } from '../model/messageTypes'

/**
 * 쪽지 첨부 목록 조회(F1519 → `GET /api/messages/{messageId}/files`, 200 `FileListInfo[]`).
 *
 * REST Docs 미커버 조회 GET이라 PRD(docs/prd/15.message-prd.md §참조 계약 매핑)의 컨트롤러/DTO
 * 소스 실측을 ground truth로 사용한다. path 파라미터(messageId)만 받고 쿼리 파라미터가 없어
 * 조건부 params 조립 없이 그대로 GET한다(approval getMySubmittedDrafts 패턴의 단순형).
 * 상세 뷰(T3.3)·편집 모드 첨부 관리(T5.4)가 동일 시그니처로 공용 소비하며, 실패 처리는
 * 소비 컴포넌트가 apiError 매핑으로 담당한다.
 */
export async function getMessageFiles(messageId: number): Promise<FileListInfo[]> {
  const { data } = await apiClient.get<FileListInfo[]>(`/api/messages/${messageId}/files`)
  return data
}
