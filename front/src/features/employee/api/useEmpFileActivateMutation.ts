import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { activateEmpFile } from './activateEmpFile'

interface EmpFileActivateVariables {
  fileId: number
  isForActivate: boolean
}

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
