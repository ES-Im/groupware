import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { FranchiseManagerPicker } from './FranchiseManagerPicker'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { useFranchiseInquiryAssignAnswerMutation } from '../api/useFranchiseInquiryAssignAnswerMutation'

interface FranchiseInquiryManagerAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inquiryId: number
  currentManagerEmpId: number | null
}

export function FranchiseInquiryManagerAssignDialog({
  open,
  onOpenChange,
  inquiryId,
  currentManagerEmpId,
}: FranchiseInquiryManagerAssignDialogProps) {
  const mutation = useFranchiseInquiryAssignAnswerMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  useEffect(() => {
    if (open) {
      setSelected([])
    }
  }, [open])

  const nextManager = selected[0]

  function handleSubmit() {
    if (!nextManager) {
      return
    }
    mutation.mutate(
      { inquiryId, assignedEmpId: nextManager.empId },
      {
        onSuccess: () => {
          toast.success('답변 담당자를 배정했습니다')
          onOpenChange(false)
        },
        onError: (error) => {
          handleApiError(error, { toast })
        },
      },
    )
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
          <DialogTitle>답변 담당자 배정</DialogTitle>
          <DialogDescription>
            답변을 담당할 사원 1명을 선택합니다. 담당자는 가맹점 권한이 있는 활성 사원이어야
            합니다.
          </DialogDescription>
        </DialogHeader>

        <FranchiseManagerPicker
          selected={selected}
          onChange={setSelected}
          multiple={false}
          disabledEmpIds={currentManagerEmpId != null ? [currentManagerEmpId] : undefined}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={mutation.isPending}>
              취소
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!nextManager || mutation.isPending}
          >
            {mutation.isPending ? '배정 중...' : '배정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
