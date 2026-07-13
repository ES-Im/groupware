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
  /** 다이얼로그 열림 상태(제어형, FranchiseInquiryDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  inquiryId: number
  /**
   * 현재 담당 사원 식별 번호 — EmployeePicker에서 선택 불가(비활성)로 표시한다.
   * 담당자 미배정 문의라면 null(T5.4 — 배정 유도 분기와 동일한 null 계약).
   */
  currentManagerEmpId: number | null
}

/**
 * 문의 답변 담당자 배정 다이얼로그(F1620, `FRANCHISE_INQUIRY_ASSIGN_ANSWER`,
 * ROADMAP(FRANCHISE) T5.3). FranchiseManagerUpdateDialog(T2.4-c)와 완전 동형 구조 —
 * EmployeePicker(multiple=false)를 Dialog에 넣은 단일 배정형이다. null 배정은 쿼리 파라미터
 * 필수라 불가하므로 미선택 시 확정 버튼을 비활성화한다.
 *
 * 후보는 FranchiseManagerPicker가 **FRANCHISE 권한 사원만** 노출하도록 사전 필터링한다
 * (FRANCHISE_ASSIGNABLE_MANAGERS 소비). 활성·권한 최종 판정은 여전히 서버가 담당하며, 도메인
 * 위반은 handleApiError 토스트로 노출한다(발명 금지). 현재 담당자만 disabledEmpIds로 비활성
 * 처리해 무의미한 "같은 담당자로 재배정" 요청을 막는다.
 * 성공(204) 시 useFranchiseInquiryAssignAnswerMutation이 상세/목록을 invalidate하므로 이
 * 컴포넌트는 성공 토스트 + 다이얼로그 닫기만 담당한다.
 */
export function FranchiseInquiryManagerAssignDialog({
  open,
  onOpenChange,
  inquiryId,
  currentManagerEmpId,
}: FranchiseInquiryManagerAssignDialogProps) {
  const mutation = useFranchiseInquiryAssignAnswerMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  // 열릴 때마다 이전 선택이 남지 않도록 초기화한다(제어형 다이얼로그는 언마운트되지 않는다 —
  // FranchiseManagerUpdateDialog의 reset과 동일 이유).
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

  // 배정 요청 중에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(FranchiseManagerUpdateDialog와
  // 동일 이유 — 그 사이 닫히면 뒤늦게 도착하는 실패 토스트와 화면 상태가 어긋난다).
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
