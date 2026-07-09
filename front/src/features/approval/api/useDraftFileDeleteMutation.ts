import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvalKeys } from '../model/queryKeys'
import { deleteDraftFile } from './deleteDraftFile'

/** useDraftFileDeleteMutation 호출 변수. */
interface DraftFileDeleteVariables {
  draftId: number
  fileId: number
}

/**
 * 기안서 첨부파일 삭제 mutation 훅(`DRAFT_FILE_DELETE`, ROADMAP(DRAFT) T6.1).
 * 성공(204) 시 onSuccess에서 `approvalKeys.all`을 invalidate해 상세(첨부 목록 포함)와 문서함 목록
 * (isFileAttached)이 최신 상태로 재조회되도록 한다. 실패 시 에러는 그대로 던져 호출부(T6.3)가
 * apiError 매핑으로 위임하도록 둔다(board useBoardFileDeleteMutation 복제).
 */
export function useDraftFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ draftId, fileId }: DraftFileDeleteVariables) => deleteDraftFile(draftId, fileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
