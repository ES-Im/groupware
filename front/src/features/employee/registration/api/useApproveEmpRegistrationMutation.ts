import { useMutation } from '@tanstack/react-query'
import { approveEmpRegistration } from './approveEmpRegistration'

export function useApproveEmpRegistrationMutation() {
  return useMutation({
    mutationFn: ({ empId, hiredAt }: { empId: number; hiredAt: string }) =>
      approveEmpRegistration(empId, hiredAt),
  })
}
