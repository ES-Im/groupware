import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { deleteMessageFile } from './deleteMessageFile'

/** useDeleteMessageFileMutation 호출 변수. messageId 대상 쪽지 + 삭제할 첨부 fileId. */
interface DeleteMessageFileVariables {
  messageId: number
  fileId: number
}

/**
 * 쪽지 첨부파일 개별 삭제 mutation 훅(`MESSAGE_FILE_DELETE`, F1521, ROADMAP(MESSAGE) T5.4).
 * 성공(204) 시 messageKeys.all을 invalidate해 첨부 목록(messageKeys.files prefix-match)과
 * 목록 fileCount가 함께 최신화되도록 한다. onError를 정의하지 않아 에러가 그대로 전파된다 —
 * 호출부(편집 뷰의 self-contained 삭제 핸들러)가 개별 처리한다.
 */
export function useDeleteMessageFileMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, DeleteMessageFileVariables>({
    mutationFn: ({ messageId, fileId }) => deleteMessageFile(messageId, fileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
