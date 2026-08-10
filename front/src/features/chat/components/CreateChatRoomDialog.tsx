import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
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
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { useCreateChatRoomMutation } from '../api/useCreateChatRoomMutation'
import { useChatOverlayStore } from '../lib/chatOverlayStore'

interface CreateChatRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChatRoomDialog({ open, onOpenChange }: CreateChatRoomDialogProps) {
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])
  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId
  const selectRoom = useChatOverlayStore((state) => state.selectRoom)
  const mutation = useCreateChatRoomMutation()

  useEffect(() => {
    if (!open) {
      setSelected([])
    }
  }, [open])

  const memberIds = selected.map((emp) => emp.empId)

  function handleCreate() {
    if (memberIds.length === 0) {
      return
    }
    mutation.mutate(
      { memberIds },
      {
        onSuccess: (result) => {
          onOpenChange(false)
          selectRoom(result.id)
        },
        onError: (error) => handleApiError(error, { toast }),
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
          <DialogTitle>새 채팅</DialogTitle>
          <DialogDescription>대화를 시작할 사원을 선택합니다(최소 1명).</DialogDescription>
        </DialogHeader>

        <EmployeePicker
          selected={selected}
          onChange={setSelected}
          disabledEmpIds={myEmpId != null ? [myEmpId] : undefined}
        />

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
            onClick={handleCreate}
            disabled={mutation.isPending || memberIds.length === 0}
          >
            {mutation.isPending ? '생성 중...' : `생성${memberIds.length > 0 ? ` (${memberIds.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
