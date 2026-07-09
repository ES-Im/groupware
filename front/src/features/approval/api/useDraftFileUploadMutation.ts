import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateDraftFileUpload } from '../lib/draftFileValidation'
import type { DraftFile } from '../model/draftDetail'
import { approvalKeys } from '../model/queryKeys'
import { uploadDraftFile } from './uploadDraftFile'

/**
 * useDraftFileUploadMutation 호출 변수.
 * `existingFiles`는 현재 첨부 목록(상세 응답 `draft.files`)이며, 사전검증(개수/총량 누적 기준)에
 * 쓰인다 — 생략 시 기존 첨부가 없다고 간주하므로, 호출부는 항상 최신 목록을 전달해야 한다.
 */
interface DraftFileUploadVariables {
  draftId: number
  files: File[]
  existingFiles?: DraftFile[]
}

/**
 * 기안서 첨부파일 업로드 mutation 훅(`DRAFT_FILE_UPLOAD`, ROADMAP(DRAFT) T6.1).
 *
 * `validateDraftFileUpload`(개수 최대 10개·총 10MB·확장자 화이트리스트)를 먼저 통과해야 실제 PATCH가
 * 나간다 — 위반 시 네트워크 요청 자체가 발생하지 않고 `DraftFileValidationError`가 그대로 던져진다
 * (호출부가 토스트로 위임).
 *
 * 다중 파일은 파일별 순차 PATCH로 처리한다(Open Q#6 — `DRAFT_FILE_UPLOAD` request-parts는 단수
 * `file` 1개만 문서화되어 다중 part 일괄 전송을 시도하지 않음). 순차 처리 중 하나라도 실패하면 그
 * 시점에서 중단하고 에러를 던진다 — 이미 성공한 파일들의 반영은 이후 재조회에 맡긴다(부분 실패
 * 롤백은 이번 태스크 범위 밖, board useBoardFileUploadMutation 복제).
 *
 * 전체 성공 시 onSuccess에서 `approvalKeys.all`을 invalidate해 상세(첨부 목록 포함)와 문서함 목록
 * (isFileAttached)이 최신 상태로 재조회되도록 한다.
 */
export function useDraftFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ draftId, files, existingFiles = [] }: DraftFileUploadVariables) => {
      validateDraftFileUpload(files, existingFiles)

      // Open Q#6: 단수 file part만 문서화됨 → 다중 part 일괄 전송을 발명하지 않고 파일별 순차 PATCH를
      // 기본안으로 처리한다.
      for (const file of files) {
        await uploadDraftFile(draftId, file)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
