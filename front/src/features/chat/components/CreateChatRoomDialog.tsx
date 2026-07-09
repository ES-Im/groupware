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
import { EmployeePicker, type EmployeePickerEmployee } from '@/features/approval/components/EmployeePicker'
import { useCreateChatRoomMutation } from '../api/useCreateChatRoomMutation'
import { useChatOverlayStore } from '../lib/chatOverlayStore'

interface CreateChatRoomDialogProps {
  /** 다이얼로그 열림 상태(제어형, ChatRoomListPanel 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 채팅방 생성 다이얼로그(ROADMAP(CHAT) T3.1, F906 §페이지별 상세(생성 다이얼로그)).
 *
 * T3.1-a가 대상 사원 검색·다중 선택 UI(EmployeePicker 재사용)를 산출했고, T3.1-b가 실제
 * `CHAT_ROOM_CREATE` POST 호출 → `roomId` 이동 → 목록 invalidate로 이어받아 완성한다.
 *
 * Open Q#2(`memberIds` 후보 사원 검색 표준 경로)는 전자결재 도메인의 동일 이슈(PRD Open Q#1)에서
 * 이미 `DEPTS`(부서) → `DEPT_MEMBERS`(부서원, EMPLOYEE 게이트) 흐름으로 확정됐고, 그 구현체인
 * `EmployeePicker`(approval 도메인, 부서 특정 로직 없는 범용 컴포넌트)가 이미 존재한다. chat이
 * dept/org 도메인을 cross-consume하는 지점이라 신규 사원 검색 UI를 발명하지 않고 **그대로
 * 재사용**한다(중복 구현 금지).
 *
 * `CirculationAddDialog`(approval)와 동일한 제어형 패턴: 다이얼로그가 닫히면 선택을 리셋하고,
 * 제출 중(`mutation.isPending`)에는 닫기를 무시해 뒤늦은 실패가 삼켜지지 않게 한다. `memberIds`
 * (빈 배열 불가, 계약상 필수)는 `selected`에서 파생하며, 빈 선택 상태는 `memberIds.length === 0`
 * 으로 구분해 생성 버튼을 비활성화한다.
 *
 * 로그인 본인은 후보 목록에서 제외한다(`disabledEmpIds`, `CirculationAddDialog`가 `drafterEmpId`를
 * 넘기는 방식과 동일). 백엔드 `ChatRoom.createRoom()`이 방 생성자를 멤버에 자동 포함시키므로(사용자
 * 확인), 프론트가 본인 empId를 `memberIds`에 중복 포함하면 안 된다. 채팅 창은 인증 완료 후에만
 * 렌더되므로(T0.3) `useMeQuery` 캐시가 이미 채워져 있는 게 일반적이지만, 과도기적으로 아직
 * 로딩 중이면 `disabledEmpIds`가 빈 배열이 되어 방어가 일시적으로 느슨해질 수 있다(최종 방어는
 * 서버 응답에 위임).
 *
 * 성공(`200 { roomId }`, **201 아님**) 시 다이얼로그를 닫고 오버레이 스토어의 `selectRoom`으로
 * 해당 방 대화 패널을 연다 — 목록 invalidate는 `useCreateChatRoomMutation`의 onSuccess가
 * 담당한다. 실패는 `handleApiError`로 sonner 토스트만 띄우고 다이얼로그는 열린 채로 유지해
 * 재시도할 수 있게 한다.
 */
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
        // 닫히면 useEffect(!open)가 선택을 리셋하므로 여기서 별도 setSelected는 두지 않는다.
        onSuccess: (result) => {
          onOpenChange(false)
          selectRoom(result.roomId)
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
