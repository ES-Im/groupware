import { useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { appointDepartmentLeader } from './appointDepartmentLeader'

interface AppointDepartmentLeaderVariables {
  deptId: number
  leaderEmpId: number
  appointedAt: string
}

export function useAppointDepartmentLeaderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ deptId, leaderEmpId, appointedAt }: AppointDepartmentLeaderVariables) =>
      appointDepartmentLeader(deptId, { leaderEmpId, appointedAt }),
    onSuccess: async (_data, { deptId }) => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(deptId) })
    },
  })
}
