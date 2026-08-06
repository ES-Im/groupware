import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EmpStatusActionButtons } from './EmpStatusActionButtons'
import type { EmpStatus } from '../model/empManagement'
import { empStatusLabels } from '../model/empManagement'

interface EmpStatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empId: number
  status: EmpStatus
}

export function EmpStatusChangeDialog({ open, onOpenChange, empId, status }: EmpStatusChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>근무 상태 변경</DialogTitle>
          <DialogDescription>
            현재 상태는 <span className="font-medium text-foreground">{empStatusLabels[status]}</span>입니다.
            활성화·정직·퇴직 중 하나로 전환합니다.
          </DialogDescription>
        </DialogHeader>
        <EmpStatusActionButtons empId={empId} status={status} />
      </DialogContent>
    </Dialog>
  )
}
