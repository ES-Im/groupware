import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { FranchiseEducationCreateForm } from './FranchiseEducationCreateForm'

interface FranchiseEducationCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (educationId: number) => void
}

export function FranchiseEducationCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: FranchiseEducationCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>교육 등록</DialogTitle>
          <DialogDescription>가맹점 교육 일정을 등록합니다.</DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            등록한 교육은 <strong className="font-semibold">비활성 상태</strong>로 생성됩니다. 신청을
            받으려면 교육 상세 화면에서 활성화해주세요.
          </p>
        </div>

        <FranchiseEducationCreateForm
          onCancel={() => onOpenChange(false)}
          onSuccess={onCreated}
        />
      </DialogContent>
    </Dialog>
  )
}
