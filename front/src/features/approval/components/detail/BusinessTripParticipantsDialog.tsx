import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { useBusinessTripParticipantsUpdateMutation } from '../../api/useBusinessTripParticipantsUpdateMutation'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'

interface BusinessTripParticipantsDialogProps {
  draftId: number
  participants: EmployeePickerEmployee[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BusinessTripParticipantsDialog({
  draftId,
  participants,
  open,
  onOpenChange,
}: BusinessTripParticipantsDialogProps) {
  const mutation = useBusinessTripParticipantsUpdateMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  useEffect(() => {
    setSelected(open ? participants : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSave() {
    if (selected.length === 0) {
      return
    }
    mutation.mutate(
      { draftId, participantIds: selected.map((emp) => emp.empId) },
      {
        onSuccess: () => {
          onOpenChange(false)
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>참여자 수정</DialogTitle>
          <DialogDescription>
            이 출장에 참여할 사원을 선택합니다. 저장하면 현재 선택 전체로 참여자 목록이 교체됩니다(최소
            1명 필요).
          </DialogDescription>
        </DialogHeader>

        <EmployeePicker selected={selected} onChange={setSelected} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={mutation.isPending || selected.length === 0}
          >
            {mutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
