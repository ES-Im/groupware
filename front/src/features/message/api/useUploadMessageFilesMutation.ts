import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { uploadMessageFiles } from './uploadMessageFiles'

/** useUploadMessageFilesMutation 호출 변수(파일별 순차 PATCH는 uploadMessageFiles 내부 처리). */
interface UploadMessageFilesVariables {
  messageId: number
  files: File[]
}

/**
 * 쪽지 첨부파일 업로드 mutation 훅(`MESSAGE_FILE_UPLOAD`, F1520, ROADMAP(MESSAGE) T4.3-a).
 *
 * 개수·총량·확장자 사전검증은 스테이징 단계의 messageFileValidation(T4.1)이 담당하므로 여기서
 * 재검증하지 않는다 — approval useDraftFileUploadMutation(업로드 직전 재검증)과 달리 순수
 * 업로드만 수행한다. onError를 정의하지 않아 에러가 그대로 전파된다 — 오케스트레이션
 * 호출부(T4.3-b)의 submitWithErrorMapping이 단계별 실패 처리를 일괄 위임받는다.
 *
 * 전체 성공 시 messageKeys.all을 invalidate해 첨부 목록(files 축)과 목록 fileCount가
 * 최신 상태로 재조회되도록 한다.
 */
export function useUploadMessageFilesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, files }: UploadMessageFilesVariables) =>
      uploadMessageFiles(messageId, files),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
