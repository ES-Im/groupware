import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useTransferEmpBelongingMutation } from '../api/useTransferEmpBelongingMutation'
import { EmpBelongingsAssignmentForm } from '../registration/components/EmpBelongingsAssignmentForm'
import type { EmpBelongingsFormValues } from '../registration/model/empBelongingsFormSchema'
import type { PositionCode } from '../registration/model/positionCode'

interface EmpBelongingTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empId: number
  currentPrimaryStartAt: string
  defaultStartAt: string
}

export function EmpBelongingTransferDialog({
  open,
  onOpenChange,
  empId,
  currentPrimaryStartAt,
  defaultStartAt,
}: EmpBelongingTransferDialogProps) {
  const mutation = useTransferEmpBelongingMutation()

  async function handleSubmit(values: EmpBelongingsFormValues) {
    await mutation.mutateAsync({
      empId,
      currentPrimaryStartAt,
      deptId: Number(values.deptId),
      position: values.position as PositionCode,
      startAt: values.startAt,
    })
    toast.success('부서를 이동했습니다')
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
          <DialogTitle>부서 이동</DialogTitle>
          <DialogDescription>현재 소속을 종료하고 새 부서로 전보합니다.</DialogDescription>
        </DialogHeader>
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          발령 시작일은 현재 소속 시작일(
          <span className="font-medium text-foreground">{currentPrimaryStartAt}</span>) 이후여야 합니다.
        </p>
        <EmpBelongingsAssignmentForm defaultStartAt={defaultStartAt} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
