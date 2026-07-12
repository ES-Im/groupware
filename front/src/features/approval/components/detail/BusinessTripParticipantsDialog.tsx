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
  /** 참여자를 교체할 출장 기안 식별 번호. */
  draftId: number
  /** 현재 참여자(`businessTrip.participants`) — 다이얼로그 진입 시 선반영할 기존 선택. */
  participants: EmployeePickerEmployee[]
  /** 다이얼로그 열림 상태(제어형, BusinessTripDraftBody 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 출장 참여자 수정 다이얼로그(`BUSINESS_TRIP_PARTICIPANTS_UPDATE`, F732, ROADMAP(DRAFT-BUSINESSTRIP) T3.3).
 *
 * `CirculationAddDialog`(①선례) 제어형 패턴을 복제하되 **add가 아닌 전량 교체**로 변형한다: 다이얼로그가
 * 열릴 때 기존 참여자(`participants`)를 `EmployeePicker` 초기 선택으로 선반영해 사용자가 전체 집합을
 * 편집하게 하고, `[저장]`은 현재 선택 전체(`selected.map(e=>e.empId)`)를 전송한다(add/remove 세분 조작
 * 없음 — PRD §참여자=전량 교체). 참여자 교체는 계약상 빈 배열을 허용하지 않으므로 선택 0명이면 저장
 * 버튼을 비활성화한다. 제출 중에는 닫기를 무시한다(뒤늦은 실패가 삼켜지지 않도록).
 */
export function BusinessTripParticipantsDialog({
  draftId,
  participants,
  open,
  onOpenChange,
}: BusinessTripParticipantsDialogProps) {
  const mutation = useBusinessTripParticipantsUpdateMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  // 열릴 때마다 기존 참여자를 선반영(전량 교체 전제 — add 아님), 닫히면 리셋한다.
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
        // 닫히면 위 useEffect(!open)가 선택을 리셋하므로 여기서 별도 setSelected는 두지 않는다.
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
