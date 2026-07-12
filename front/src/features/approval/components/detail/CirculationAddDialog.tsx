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
  /** 공람자를 추가할 기안서 식별 번호. */
  draftId: number
  /** 이미 공람 지정된 사원 empId(중복 지정 방지 — disabledEmpIds). */
  existingEmpIds: number[]
  /** 기안자 본인 empId(자기 자신은 공람 대상에서 제외). */
  drafterEmpId: number
  /** 다이얼로그 열림 상태(제어형, CirculationSection 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 공람자 추가 다이얼로그(F707 `DRAFT_CIRCULATION_ADD`, ROADMAP(DRAFT) T5.2).
 *
 * 기안자만 연다(노출 판정은 CirculationSection). EmployeePicker(T4.4 재사용)로 사원을 선택해
 * `{ empIds }`로 배치 추가한다 — 취소기안 결재선과 달리 role/order 없이 empId 배열만 매핑한다.
 * 이미 공람 중인 사원과 기안자 본인은 `disabledEmpIds`로 중복/자기지정을 막는다. 성공 시 다이얼로그
 * 를 닫고 선택을 리셋한다(상세 갱신은 mutation onSuccess의 approvalKeys.all invalidate). 제출 중에는
 * 닫기를 무시한다(뒤늦은 실패가 삼켜지지 않도록 — CancellationDraftDialog와 동일 가드).
 */
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
        // 닫히면 useEffect(!open)가 선택을 리셋하므로 여기서 별도 setSelected는 두지 않는다.
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
