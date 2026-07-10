import { useNavigate } from 'react-router'
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
import { useCancelMeetingReservationMutation } from '../api/useCancelMeetingReservationMutation'

interface CancelReservationAlertDialogProps {
  meetingId: number
}

/**
 * 예약 취소 확인 다이얼로그(`MEETING_RESERVATION_CANCEL`, F806, ROADMAP(MEETING-ROOMS) T4.3-c).
 *
 * `CommentItem`(board 선례)의 AlertDialog 확인 패턴 동형. 취소 성공(204) 시
 * `useCancelMeetingReservationMutation`(T4.2)이 이미 `meetingKeys.all`을 invalidate하므로 이
 * 컴포넌트는 성공 토스트 + P1(`/meetings`) 복귀만 담당한다(PRD §페이지별 상세 P3 "취소 후 → P1
 * 복귀 가능"). 소유자 불일치·이미 취소된 예약 등 서버 위반은 `handleApiError`로 토스트 처리한다
 * (`code` 비의존).
 */
export function CancelReservationAlertDialog({ meetingId }: CancelReservationAlertDialogProps) {
  const navigate = useNavigate()
  const mutation = useCancelMeetingReservationMutation()

  function handleCancel() {
    mutation.mutate(meetingId, {
      onSuccess: () => {
        toast.success('예약을 취소했습니다')
        navigate('/meetings')
      },
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline">
          예약 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>예약을 취소하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            취소한 예약은 되돌릴 수 없습니다. 취소 후에는 예약 정보를 수정할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>돌아가기</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={mutation.isPending}>
            {mutation.isPending ? '취소 처리 중...' : '예약 취소'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
