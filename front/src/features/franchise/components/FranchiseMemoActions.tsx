import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useFranchiseMemoClearMutation } from '../api/useFranchiseMemoClearMutation'
import { useFranchiseMemoUpdateMutation } from '../api/useFranchiseMemoUpdateMutation'
import { franchiseMemoSchema, type FranchiseMemoFormValues } from '../model/franchiseMemoSchema'

interface FranchiseMemoActionsProps {
  franchiseId: number
  currentMemo: string
}

export function FranchiseMemoActions({ franchiseId, currentMemo }: FranchiseMemoActionsProps) {
  const updateMutation = useFranchiseMemoUpdateMutation()
  const clearMutation = useFranchiseMemoClearMutation()
  const [editOpen, setEditOpen] = useState(false)

  const form = useZodForm(franchiseMemoSchema)
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (editOpen) {
      reset({ memo: currentMemo })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, reset])

  async function handleUpdate(values: FranchiseMemoFormValues) {
    await updateMutation.mutateAsync({ franchiseId, memo: values.memo })
    toast.success('메모를 수정했습니다')
    setEditOpen(false)
  }

  function handleClear() {
    clearMutation.mutate(franchiseId, {
      onSuccess: () => {
        toast.success('메모를 삭제했습니다')
      },
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  function handleEditOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    setEditOpen(nextOpen)
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        메모 수정
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={!currentMemo}>
            메모 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메모를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제하면 가맹점 특이사항 메모가 비워집니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearMutation.isPending}>돌아가기</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} disabled={clearMutation.isPending}>
              {clearMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메모 수정</DialogTitle>
            <DialogDescription>가맹점 특이사항 메모를 수정합니다. 공백만으로는 저장할 수 없습니다.</DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={submitWithErrorMapping(form, handleUpdate)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="franchise-memo-textarea">메모</Label>
              <Textarea
                id="franchise-memo-textarea"
                aria-invalid={!!errors.memo}
                {...register('memo')}
              />
              {errors.memo && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.memo.message}
                </p>
              )}
            </div>

            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
