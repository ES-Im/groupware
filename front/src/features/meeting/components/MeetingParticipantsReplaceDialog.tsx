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
  /** 현재 참여자(F801 상세 조회 결과) — 다이얼로그 진입 시 선반영할 기존 선택. */
  participants: MeetingReservationParticipant[]
  /** 다이얼로그 열림 상태(제어형, MeetingReservationDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 회의 참여자 교체 다이얼로그(`MEETING_PARTICIPANTS_REPLACE`, F805, ROADMAP(MEETING-ROOMS) T4.3-c).
 *
 * `BusinessTripParticipantsDialog`(전자결재 선례) 제어형 패턴을 그대로 복제한다: 다이얼로그가 열릴
 * 때 기존 참여자를 `EmployeePicker` 초기 선택으로 선반영하고, `[저장]`은 현재 선택 전체
 * (`participantIds`)로 전량 교체 제출한다(add/remove 세분 조작 아님). 참여자 교체는 계약상 빈 배열을
 * 허용하지 않으므로 선택 0명이면 저장 버튼을 비활성화한다. `EmployeePicker`는 부서→부서원 탐색으로
 * 전사 전체 사원 풀을 그대로 재사용한다(부서 한정 아님, PRD Open Q#1).
 *
 * 성공(204) 시 `useReplaceMeetingParticipantsMutation`(T4.2)이 이미 `meetingKeys.all`을
 * invalidate하므로 이 컴포넌트는 성공 토스트 + 닫기만 담당한다. 소유자 불일치 등 서버 위반은
 * `handleApiError`로 토스트 처리한다(`code` 비의존).
 */
export function MeetingParticipantsReplaceDialog({
  meetingId,
  participants,
  open,
  onOpenChange,
}: MeetingParticipantsReplaceDialogProps) {
  const mutation = useReplaceMeetingParticipantsMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  // 열릴 때마다 기존 참여자를 선반영(전량 교체 전제 — add 아님), 닫히면 리셋한다.
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
