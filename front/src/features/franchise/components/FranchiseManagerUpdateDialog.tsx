import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
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
import { useFranchiseManagerUpdateMutation } from '../api/useFranchiseManagerUpdateMutation'

interface FranchiseManagerUpdateDialogProps {
  /** 다이얼로그 열림 상태(제어형, FranchiseDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  franchiseId: number
  /** 현재 담당 사원 식별 번호 — EmployeePicker에서 선택 불가(비활성)로 표시한다. */
  currentManagerEmpId: number
}

/**
 * 가맹점 담당자 변경 다이얼로그(F1606, `FRANCHISE_MANAGER_UPDATE`, ROADMAP(FRANCHISE) T2.4-c).
 *
 * EmployeePicker(multiple=false 단일 선택 모드)를 Dialog에 넣은 단일 배정형이다 —
 * EmployeeSelectField(approval)의 Dialog+EmployeePicker 조합 구조만 참고하고, 다중 누적
 * 리스트 UI는 두지 않는다(단일 배정이라 새 선택이 기존 선택을 대체). 선택 1명 확정 후
 * [변경] 버튼으로 mutation을 트리거한다.
 *
 * 새 담당자의 활성·FRANCHISE 권한 여부는 서버가 판정한다 — 프론트는 사전 필터링 없이 empId를
 * 그대로 보내고, 도메인 위반은 handleApiError 토스트로 노출한다(발명 금지). 현재 담당자만
 * disabledEmpIds로 비활성 처리해 무의미한 "같은 담당자로 변경" 요청을 막는다.
 * 성공(204) 시 useFranchiseManagerUpdateMutation이 상세/목록을 invalidate하므로 이 컴포넌트는
 * 성공 토스트 + 다이얼로그 닫기만 담당한다.
 */
export function FranchiseManagerUpdateDialog({
  open,
  onOpenChange,
  franchiseId,
  currentManagerEmpId,
}: FranchiseManagerUpdateDialogProps) {
  const mutation = useFranchiseManagerUpdateMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])

  // 열릴 때마다 이전 선택이 남지 않도록 초기화한다(제어형 다이얼로그는 언마운트되지 않는다 —
  // FranchiseUpdateDialog의 reset과 동일 이유).
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
      { franchiseId, newManagerId: nextManager.empId },
      {
        onSuccess: () => {
          toast.success('담당자를 변경했습니다')
          onOpenChange(false)
        },
        onError: (error) => {
          handleApiError(error, { toast })
        },
      },
    )
  }

  // 변경 요청 중에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(FranchiseUpdateDialog와 동일
  // 이유 — 그 사이 닫히면 뒤늦게 도착하는 실패 토스트와 화면 상태가 어긋난다).
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
          <DialogTitle>담당자 변경</DialogTitle>
          <DialogDescription>
            새 담당 사원 1명을 선택합니다. 담당자는 가맹점 권한이 있는 활성 사원이어야 합니다.
          </DialogDescription>
        </DialogHeader>

        <EmployeePicker
          selected={selected}
          onChange={setSelected}
          multiple={false}
          disabledEmpIds={[currentManagerEmpId]}
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
            {mutation.isPending ? '변경 중...' : '변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
