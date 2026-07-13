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
  /** 종료 대상 현재 주요 소속의 시작일. useTransferEmpBelongingMutation에 그대로 재전송된다. */
  currentPrimaryStartAt: string
  defaultStartAt: string
}

/**
 * 부서 전보(재직 중인 사원의 소속 이동) 다이얼로그(EmpManagementSheet 전용).
 *
 * EmpBelongingsAssignmentForm(원래 신규 사원 등록 2단계 폼, registration 도메인)을 그대로
 * 재사용하되, onSubmit을 useTransferEmpBelongingMutation(2-call 오케스트레이션)에 연결한다 —
 * EmpApprovalWizardDialog가 같은 폼을 useUpdateEmpBelongingsMutation(신규가입자 전용)에 연결하는
 * 것과 동일한 재사용 패턴이다.
 *
 * 발령시작일이 현재 소속 시작일 이전/동일이면 서버가 도메인 에러로 거부한다
 * (useTransferEmpBelongingMutation JSDoc 참고) — 여기서는 그 제약을 안내 문구로만 노출하고,
 * 실제 검증은 서버 응답을 EmpBelongingsAssignmentForm 내부의 submitWithErrorMapping이
 * errors.root로 매핑하는 기존 흐름에 위임한다(새 클라이언트 검증 로직을 추가하지 않음).
 */
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
