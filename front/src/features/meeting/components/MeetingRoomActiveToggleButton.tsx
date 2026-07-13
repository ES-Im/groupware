import { useState } from 'react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { useMeetingRoomActivateMutation } from '../api/useMeetingRoomActivateMutation'
import { useMeetingRoomDeactivateMutation } from '../api/useMeetingRoomDeactivateMutation'

interface MeetingRoomActiveToggleButtonProps {
  meetingRoomId: number
  isAvailable: boolean
  /**
   * 트리거 표현. P6 관리 목록의 "관리" 컬럼은 목업대로 토글 스위치(`'switch'`)를, P7 상세 헤더는
   * 텍스트 버튼(`'button'`, 기본값)을 사용한다. 어느 쪽이든 클릭 즉시 반영이 아니라 AlertDialog
   * 확인을 거친다 — 목록에서의 오조작을 막기 위함(사용자 확정).
   */
  variant?: 'switch' | 'button'
}

/**
 * 회의실 활성/비활성 토글 확인 컨트롤(`MEETING_ROOM_ACTIVATE`/`_DEACTIVATE`,
 * F814, ROADMAP(MEETING-ROOMS) T6.3-b). CancelReservationAlertDialog(T4.3-c)와 동형 AlertDialog
 * 확인 패턴이며, T6.2의 독립 export mutation 훅(M7 T7.2가 상세 화면에서 재사용할 대상)을
 * 그대로 소비한다.
 *
 * `variant='switch'`는 트리거를 토글 스위치로 렌더하되, 스위치 조작을 곧바로 상태 변경으로
 * 흘려보내지 않고 AlertDialog를 열어 확인을 받는다. 스위치의 체크 상태는 서버 값(`isAvailable`)을
 * 그대로 반영하므로(확인 전까지 낙관적으로 뒤집지 않음), 확인을 취소하면 원래 상태가 유지된다.
 *
 * 표의 각 행이 클릭 시 P7(상세)로 내비게이션하므로(MeetingRoomManagementPage), 이 컨트롤과
 * AlertDialog 콘텐츠(Radix Portal로 렌더되지만 React 트리 기준으로는 이 컴포넌트의 자식이라
 * 클릭/키다운 이벤트가 React 트리를 타고 행까지 버블링된다) 전체를 감싼 wrapper에서
 * stopPropagation으로 막아 행 내비게이션과의 중복 트리거를 방지한다.
 */
export function MeetingRoomActiveToggleButton({
  meetingRoomId,
  isAvailable,
  variant = 'button',
}: MeetingRoomActiveToggleButtonProps) {
  const [open, setOpen] = useState(false)
  const activateMutation = useMeetingRoomActivateMutation()
  const deactivateMutation = useMeetingRoomDeactivateMutation()
  const mutation = isAvailable ? deactivateMutation : activateMutation

  function handleToggle() {
    mutation.mutate(meetingRoomId, {
      onSuccess: () => {
        toast.success(isAvailable ? '회의실을 비활성화했습니다' : '회의실을 활성화했습니다')
      },
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <AlertDialog open={open} onOpenChange={setOpen}>
        {variant === 'switch' ? (
          <button
            type="button"
            role="switch"
            aria-checked={isAvailable}
            aria-label={isAvailable ? '회의실 비활성화' : '회의실 활성화'}
            disabled={mutation.isPending}
            onClick={() => setOpen(true)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60',
              isAvailable ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
                isAvailable ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        ) : (
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              {isAvailable ? '비활성화' : '활성화'}
            </Button>
          </AlertDialogTrigger>
        )}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAvailable ? '회의실을 비활성화하시겠습니까?' : '회의실을 활성화하시겠습니까?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAvailable
                ? '비활성화하면 이후 예약 검색 시 이 회의실이 노출되지 않습니다.'
                : '활성화하면 이후 예약 검색 시 이 회의실이 다시 노출됩니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>돌아가기</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={mutation.isPending}>
              {mutation.isPending ? '처리 중...' : isAvailable ? '비활성화' : '활성화'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
