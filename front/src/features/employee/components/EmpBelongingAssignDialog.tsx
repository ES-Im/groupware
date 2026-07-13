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
  /** 폼의 발령시작일 초기값. 호출부가 오늘(또는 입사일 등)을 주입한다. */
  defaultStartAt: string
}

/**
 * 소속 없는 사원의 부서 최초 배정 다이얼로그(사원관리 목록 "관리 → 부서 배정" 진입점).
 *
 * 전보(EmpBelongingTransferDialog)와 UI는 같은 EmpBelongingsAssignmentForm을 재사용하지만,
 * 종료할 현재 소속이 없으므로 useAssignEmpBelongingMutation(단발 등록)에 연결한다 — 현재 소속
 * 시작일(currentPrimaryStartAt)이 필요 없다. EmpApprovalWizardDialog 2단계의 최초 배정과 동형이되,
 * 대상이 이미 재직(ACTIVE) 중이라는 점만 다르다.
 */
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
