import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { deleteEmpFile } from './deleteEmpFile'

/** useEmpFileDeleteMutation 호출 변수. */
interface EmpFileDeleteVariables {
  empId: number
  fileId: number
}

/**
 * 사원 파일 삭제 mutation 훅(`EMP_FILE_DELETE`).
 * 성공(204) 시 `employeeKeys.me()` + `employeeKeys.filesInfos()`를 함께 invalidate한다
 * (useEmpFileUploadMutation과 동일한 이유).
 */
export function useEmpFileDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empId, fileId }: EmpFileDeleteVariables) => deleteEmpFile(empId, fileId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.me() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.filesInfos() }),
      ])
    },
  })
}
