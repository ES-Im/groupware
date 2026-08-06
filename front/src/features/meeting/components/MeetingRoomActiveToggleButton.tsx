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
  variant?: 'switch' | 'button'
  buttonClassName?: string
}

export function MeetingRoomActiveToggleButton({
  meetingRoomId,
  isAvailable,
  variant = 'button',
  buttonClassName,
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
            <Button type="button" variant="outline" size="sm" className={buttonClassName}>
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
