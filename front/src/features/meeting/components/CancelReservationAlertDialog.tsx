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
