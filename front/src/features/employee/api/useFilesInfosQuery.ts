import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getFilesInfos } from './getFilesInfos'

export function useFilesInfosQuery(enabled: boolean) {
  return useQuery({
    queryKey: employeeKeys.filesInfos(),
    queryFn: getFilesInfos,
    enabled,
  })
}
