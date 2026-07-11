import { useQuery } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { getMessageFiles } from './getMessageFiles'

/**
 * 쪽지 첨부 목록 조회 훅(F1519, ROADMAP(MESSAGE) T3.2).
 *
 * messageId가 아직 확정되지 않은 상태(라우트 파라미터 파싱 전·유효성 실패)에는 enabled:false로
 * 훅 호출을 지연해 undefined인 채로 요청이 나가는 것을 막는다(approval useDraftDetailQuery 동형
 * 가드). queryFn은 enabled 가드로 messageId가 확정된 경우에만 실행되므로 number로 단언한다.
 * messageId가 바뀌면 queryKey(messageKeys.files)가 달라져 자동 재조회된다.
 *
 * 첨부 목록 GET은 부작용이 없어 refetchOnWindowFocus 오버라이드는 두지 않는다(전역 queryClient
 * 정책을 그대로 따른다). 실패 처리는 소비 컴포넌트(T3.3/T5.4)가 apiError 매핑으로 담당한다.
 */
export function useMessageFilesQuery(messageId: number | undefined) {
  return useQuery({
    queryKey: messageKeys.files(messageId),
    queryFn: () => getMessageFiles(messageId as number),
    enabled: messageId != null,
  })
}
