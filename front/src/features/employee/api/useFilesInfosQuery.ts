import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getFilesInfos } from './getFilesInfos'

/**
 * 프로필사진/전자서명파일 전체 조회(`RETRIEVE_FILES_INFOS`) 훅.
 * 활성 파일만 보는 useMeQuery().activeFiles의 폴백(ROADMAP T5.3, me.activeFiles가 비어있는
 * 예외 상황)뿐 아니라, 비활성 파일까지 포함한 전체 목록이 필요한 파일관리 탭
 * (EmpFileManagementPanel — 활성화/삭제 관리)의 주 데이터 소스로도 쓰인다. enabled로
 * 호출부가 필요할 때만 조회를 켠다.
 */
export function useFilesInfosQuery(enabled: boolean) {
  return useQuery({
    queryKey: employeeKeys.filesInfos(),
    queryFn: getFilesInfos,
    enabled,
  })
}
