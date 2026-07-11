import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateEducationFileUpload } from '../lib/educationFileValidation'
import type { FranchiseEducationFileInfo } from '../model/franchise'
import { franchiseKeys } from '../model/queryKeys'
import { uploadEducationFile } from './uploadEducationFile'

/**
 * useEducationFileUploadMutation 호출 변수.
 * `existingFiles`는 현재 첨부 목록(FRANCHISE_EDUCATION_DETAIL의 `fileListInfoList`)이며,
 * 사전검증(개수/총량 누적 기준)에 쓰인다 — 생략 시 기존 첨부가 없다고 간주하므로, 호출부는 항상
 * 최신 목록을 전달해야 한다.
 */
interface EducationFileUploadVariables {
  educationId: number
  files: File[]
  existingFiles?: FranchiseEducationFileInfo[]
}

/**
 * 교육 첨부파일 업로드 mutation 훅(`EDUCATION_FILE_UPLOAD`, board `useBoardFileUploadMutation`
 * 동형 복제).
 *
 * `validateEducationFileUpload`(개수 최대 10개·총 10MB·확장자 화이트리스트)를 먼저 통과해야 실제
 * PATCH가 나간다 — 위반 시 네트워크 요청 자체가 발생하지 않고 `EducationFileValidationError`가
 * 그대로 던져진다(호출부가 인스턴스 분기로 메시지를 그대로 토스트에 노출).
 *
 * 다중 파일은 파일별 순차 PATCH로 처리한다(request-parts.adoc 실측 — 단수 `file` 1개만
 * 문서화되어 다중 part 일괄 전송을 시도하지 않음). 순차 처리 중 하나라도 실패하면 그 시점에서
 * 중단하고 에러를 던진다 — 이미 성공한 파일들의 반영은 이후 재조회/재시도에 맡긴다.
 *
 * 전체 성공 시 onSuccess에서 `franchiseKeys.education.detail(educationId)`를 invalidate해
 * `useFranchiseEducationDetailQuery`가 최신 첨부 목록으로 재조회되도록 한다.
 */
export function useEducationFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      educationId,
      files,
      existingFiles = [],
    }: EducationFileUploadVariables) => {
      validateEducationFileUpload(files, existingFiles)

      for (const file of files) {
        await uploadEducationFile(educationId, file)
      }
    },
    onSuccess: async (_data, { educationId }) => {
      await queryClient.invalidateQueries({
        queryKey: franchiseKeys.education.detail(educationId),
      })
    },
  })
}
