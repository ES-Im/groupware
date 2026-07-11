import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { activateEmpFile } from './activateEmpFile'

/** useEmpFileActivateMutation 호출 변수. */
interface EmpFileActivateVariables {
  fileId: number
  isForActivate: boolean
}

/**
 * 사원 파일 활성화/비활성화 mutation 훅(`ACTIVATE_ME_FILE`).
 * 성공(204) 시 `employeeKeys.me()` + `employeeKeys.filesInfos()`를 함께 invalidate한다
 * (useEmpFileUploadMutation과 동일한 이유 — 활성 상태 전환이 양쪽 화면에 반영되어야 한다).
 */
export function useEmpFileActivateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, isForActivate }: EmpFileActivateVariables) =>
      activateEmpFile(fileId, isForActivate),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.me() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.filesInfos() }),
      ])
    },
  })
}
