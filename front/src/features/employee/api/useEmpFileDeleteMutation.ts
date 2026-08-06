import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { deleteEmpFile } from './deleteEmpFile'

interface EmpFileDeleteVariables {
  empId: number
  fileId: number
}

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
