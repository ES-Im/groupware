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
import { useMeetingRoomActivateMutation } from '../api/useMeetingRoomActivateMutation'
import { useMeetingRoomDeactivateMutation } from '../api/useMeetingRoomDeactivateMutation'

interface MeetingRoomActiveToggleButtonProps {
  meetingRoomId: number
  isAvailable: boolean
}

/**
 * 회의실 관리 목록 행의 활성/비활성 토글 확인 버튼(`MEETING_ROOM_ACTIVATE`/`_DEACTIVATE`,
 * F814, ROADMAP(MEETING-ROOMS) T6.3-b). CancelReservationAlertDialog(T4.3-c)와 동형 AlertDialog
 * 확인 패턴이며, T6.2의 독립 export mutation 훅(M7 T7.2가 상세 화면에서 재사용할 대상)을
 * 그대로 소비한다.
 *
 * 표의 각 행이 클릭 시 P7(상세)로 내비게이션하므로(MeetingRoomManagementPage), 이 버튼과
 * AlertDialog 콘텐츠(Radix Portal로 렌더되지만 React 트리 기준으로는 이 컴포넌트의 자식이라
 * 클릭/키다운 이벤트가 React 트리를 타고 행까지 버블링된다) 전체를 감싼 wrapper에서
 * stopPropagation으로 막아 행 내비게이션과의 중복 트리거를 방지한다.
 */
export function MeetingRoomActiveToggleButton({
  meetingRoomId,
  isAvailable,
}: MeetingRoomActiveToggleButtonProps) {
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
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            {isAvailable ? '비활성화' : '활성화'}
          </Button>
        </AlertDialogTrigger>
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
