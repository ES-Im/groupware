import type { ReactNode } from 'react'
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
import { useDraftDeleteMutation } from '../api/useDraftDeleteMutation'

interface DeleteDraftAlertDialogProps {
  draftId: number
  children: ReactNode
}

export function DeleteDraftAlertDialog({ draftId, children }: DeleteDraftAlertDialogProps) {
  const navigate = useNavigate()
  const mutation = useDraftDeleteMutation()

  function handleConfirm() {
    mutation.mutate(draftId, {
      onSuccess: () => {
        toast.success('기안서를 삭제했습니다')
        navigate('/approval/box')
      },
      onError: (error) => handleApiError(error, { toast }),
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>기안서 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            삭제한 기안서는 복구할 수 없습니다. 정말 삭제하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
