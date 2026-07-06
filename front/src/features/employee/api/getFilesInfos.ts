import { apiClient } from '@/shared/api/client'
import type { ActiveFile } from '../model/me'

/**
 * 프로필사진/전자서명파일 전체 조회(`RETRIEVE_FILES_INFOS`, api-endpoint.md EMP_ACCOUNT API 섹션,
 * GET /api/employees/me/files, back/build/generated-snippets/RETRIEVE_FILES_INFOS/response-body.adoc
 * 실측: 응답이 최상위 배열 [{file:{fileId,originalName,extension,fileSize}, type, isActive}]).
 *
 * 이 엔드포인트는 비활성 파일도 함께 반환하므로(스니펫 예시에 isActive:false 항목 포함),
 * 호출부가 반드시 isActive===true 필터를 적용해야 한다(ROADMAP T5.3 §리스크7).
 * useMeQuery()의 activeFiles가 예외적으로 비어있을 때만 대체 조회로 사용한다(useFilesInfosQuery).
 */
export async function getFilesInfos(): Promise<ActiveFile[]> {
  const { data } = await apiClient.get<ActiveFile[]>('/api/employees/me/files')
  return data
}
