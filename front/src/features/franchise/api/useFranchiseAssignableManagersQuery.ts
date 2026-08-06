import { useQuery } from '@tanstack/react-query'
import { franchiseKeys } from '../model/queryKeys'
import { getFranchiseAssignableManagers } from './getFranchiseAssignableManagers'

export function useFranchiseAssignableManagersQuery() {
  return useQuery({
    queryKey: franchiseKeys.assignableManagers(),
    queryFn: getFranchiseAssignableManagers,
  })
}
