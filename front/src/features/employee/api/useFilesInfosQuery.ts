import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getFilesInfos } from './getFilesInfos'

/**
 * 프로필사진/전자서명파일 전체 조회(`RETRIEVE_FILES_INFOS`) 폴백 훅(ROADMAP T5.3).
 * useMeQuery()의 RETRIEVE_ME_INFO 응답이 이미 activeFiles를 포함하므로(스니펫 실측)
 * 정상 흐름에서는 이 훅이 실행되지 않는다 — enabled로 호출부가 활성화할 때만
 * (me.activeFiles가 비어있거나 미보유인 예외 상황) 조회한다.
 */
export function useFilesInfosQuery(enabled: boolean) {
  return useQuery({
    queryKey: employeeKeys.filesInfos(),
    queryFn: getFilesInfos,
    enabled,
  })
}
