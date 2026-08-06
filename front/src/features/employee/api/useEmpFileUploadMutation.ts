import { useMutation, useQueryClient } from '@tanstack/react-query'
import { validateEmpFileUpload } from '../lib/empFileValidation'
import type { FileType } from '../model/me'
import { employeeKeys } from '../model/queryKeys'
import { uploadEmpFile } from './uploadEmpFile'

interface EmpFileUploadVariables {
  empId: number
  fileType: FileType
  file: File
}

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
