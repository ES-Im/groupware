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

/**
 * 근무 상태 변경 모달(사원관리 목록의 "관리 → 근무 상태 변경" 진입점).
 *
 * 상태 전환 로직 자체는 EmpStatusActionButtons(활성화/정직/퇴직, 각 항목은 확인용 AlertDialog)를
 * 그대로 재사용하고, 여기서는 그 3종 버튼을 하나의 Dialog로 감싸 "모달형" 진입점만 제공한다.
 * 전환 성공 시 각 mutation이 목록 캐시를 invalidate하므로, status prop(호출부가 목록 rows에서
 * 파생한 최신 값)이 갱신되면 버튼의 disabled 상태도 함께 최신화된다.
 */
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
