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
import { useCirculationAddMutation } from '../../api/useCirculationAddMutation'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'

interface CirculationAddDialogProps {
  draftId: number
  existingEmpIds: number[]
  drafterEmpId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CirculationAddDialog({
  draftId,
  existingEmpIds,
  drafterEmpId,
  open,
  onOpenChange,
}: CirculationAddDialogProps) {
  const mutation = useCirculationAddMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  useEffect(() => {
    if (!open) {
      setSelected([])
    }
  }, [open])

  function handleAdd() {
    if (selected.length === 0) {
      return
    }
    mutation.mutate(
      { draftId, empIds: selected.map((emp) => emp.empId) },
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
          <DialogTitle>공람자 추가</DialogTitle>
          <DialogDescription>
            이 기안서를 공람할 사원을 선택합니다. 공람자는 원본 기안이 결재 완료된 뒤 문서를 열람할 수
            있습니다.
          </DialogDescription>
        </DialogHeader>

        <EmployeePicker
          selected={selected}
          onChange={setSelected}
          disabledEmpIds={[...existingEmpIds, drafterEmpId]}
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
            onClick={handleAdd}
            disabled={mutation.isPending || selected.length === 0}
          >
            {mutation.isPending ? '추가 중...' : `추가${selected.length > 0 ? ` (${selected.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
