import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { useReplaceMeetingParticipantsMutation } from '../api/useReplaceMeetingParticipantsMutation'
import type { MeetingReservationParticipant } from '../model/meeting'

interface MeetingParticipantsReplaceDialogProps {
  meetingId: number
  participants: MeetingReservationParticipant[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MeetingParticipantsReplaceDialog({
  meetingId,
  participants,
  open,
  onOpenChange,
}: MeetingParticipantsReplaceDialogProps) {
  const mutation = useReplaceMeetingParticipantsMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  useEffect(() => {
    setSelected(open ? participants.map((p) => ({ empId: p.empId, empName: p.empName })) : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSave() {
    if (selected.length === 0) {
      return
    }
    mutation.mutate(
      { meetingId, participantIds: selected.map((emp) => emp.empId) },
      {
        onSuccess: () => {
          toast.success('참여자를 교체했습니다')
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>참여자 교체</DialogTitle>
          <DialogDescription>
            이 회의에 참여할 사원을 선택합니다. 저장하면 현재 선택 전체로 참여자 목록이 교체됩니다(최소
            1명 필요).
          </DialogDescription>
        </DialogHeader>

        <EmployeePicker selected={selected} onChange={setSelected} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
            취소
          </Button>
          <Button type="button" onClick={handleSave} disabled={mutation.isPending || selected.length === 0}>
            {mutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
