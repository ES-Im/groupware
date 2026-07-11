import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateEmpFileUpload } from '../lib/empFileValidation'
import type { FileType } from '../model/me'
import { employeeKeys } from '../model/queryKeys'
import { uploadEmpFile } from './uploadEmpFile'

/** useEmpFileUploadMutation 호출 변수. */
interface EmpFileUploadVariables {
  empId: number
  fileType: FileType
  file: File
}

/**
 * 사원 파일(프로필사진/전자서명) 업로드 mutation 훅(`EMP_FILE_UPLOAD`).
 *
 * `validateEmpFileUpload`(확장자·용량)를 먼저 통과해야 실제 PATCH가 나간다 — 위반 시 네트워크
 * 요청 자체가 발생하지 않고 `EmpFileValidationError`가 그대로 던져진다(호출부가 토스트 노출).
 * 성공(204) 시 `employeeKeys.me()`(RETRIEVE_ME_INFO의 activeFiles)와
 * `employeeKeys.filesInfos()`(RETRIEVE_FILES_INFOS, 파일관리 탭 전체 목록)를 함께 invalidate해
 * 새 활성 파일과 자동 비활성화된 기존 파일이 양쪽 화면에 모두 반영되도록 한다.
 */
export function useEmpFileUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ empId, fileType, file }: EmpFileUploadVariables) => {
      validateEmpFileUpload(file)
      await uploadEmpFile(empId, fileType, file)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.me() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.filesInfos() }),
      ])
    },
  })
}
