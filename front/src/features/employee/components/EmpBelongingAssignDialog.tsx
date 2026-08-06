import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useAssignEmpBelongingMutation } from '../api/useAssignEmpBelongingMutation'
import { EmpBelongingsAssignmentForm } from '../registration/components/EmpBelongingsAssignmentForm'
import type { EmpBelongingsFormValues } from '../registration/model/empBelongingsFormSchema'
import type { PositionCode } from '../registration/model/positionCode'

interface EmpBelongingAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empId: number
  defaultStartAt: string
}

export function EmpBelongingAssignDialog({
  open,
  onOpenChange,
  empId,
  defaultStartAt,
}: EmpBelongingAssignDialogProps) {
  const mutation = useAssignEmpBelongingMutation()

  async function handleSubmit(values: EmpBelongingsFormValues) {
    await mutation.mutateAsync({
      empId,
      deptId: Number(values.deptId),
      position: values.position as PositionCode,
      startAt: values.startAt,
    })
    toast.success('부서를 배정했습니다')
    onOpenChange(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>부서 배정</DialogTitle>
          <DialogDescription>소속이 없는 사원에게 최초 소속을 배정합니다.</DialogDescription>
        </DialogHeader>
        <EmpBelongingsAssignmentForm defaultStartAt={defaultStartAt} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
