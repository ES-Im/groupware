import { useMutation, useQueryClient } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { deleteEducationFile } from './deleteEducationFile'

/** useEducationFileDeleteMutation 호출 변수. */
interface EducationFileDeleteVariables {
  educationId: number
  fileId: number
}

/**
 * 교육 첨부파일 삭제 mutation 훅(`EDUCATION_FILE_DELETE`, board `useBoardFileDeleteMutation`
 * 동형 복제). 성공(204) 시 onSuccess에서 `franchiseKeys.education.detail(educationId)`를
 * invalidate해 `useFranchiseEducationDetailQuery`가 최신 첨부 목록으로 재조회되도록 한다.
 * 실패 시 에러는 그대로 던져 호출부가 `normalizeApiError`로 토스트 처리하도록 둔다.
 */
export function useEducationFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ educationId, fileId }: EducationFileDeleteVariables) =>
      deleteEducationFile(educationId, fileId),
    onSuccess: async (_data, { educationId }) => {
      await queryClient.invalidateQueries({
        queryKey: franchiseKeys.education.detail(educationId),
      })
    },
  })
}
