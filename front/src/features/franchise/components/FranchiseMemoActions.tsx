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
  /** 현재 메모(프리필 기준값, FranchiseDetail.memo). */
  currentMemo: string
}

/**
 * 가맹점 메모 수정/삭제 액션(F1607 `FRANCHISE_MEMO_UPDATE` / F1608 `FRANCHISE_MEMO_CLEAR`,
 * ROADMAP(FRANCHISE) T2.4-d).
 *
 * 수정은 소형 다이얼로그 폼(memo 단일 필드, 공백 불가 — FranchiseUpdateDialog와 동일
 * useZodForm+submitWithErrorMapping 조합)이고, 삭제는 MeetingRoomActiveToggleButton 동형의
 * AlertDialog 확인 후에만 실행한다(무본문 PATCH — 되돌리기 어려운 액션이라 확인 필수).
 * 메모를 비우고 싶으면 수정 폼이 아니라 삭제를 쓴다(수정 body의 memo는 공백 불가 계약).
 * 성공(204) 시 각 mutation 훅이 상세/목록을 invalidate하므로 여기서는 토스트+닫기만 담당한다.
 */
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

  // 열릴 때마다 현재 메모로 프리필하고, 닫힐 때는 다음 오픈에 이전 입력값/에러가 남지 않도록
  // 리셋한다(FranchiseUpdateDialog와 동일 이유 — 제어형 다이얼로그는 언마운트되지 않는다).
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

  // 제출 중에는 닫기를 무시한다(FranchiseUpdateDialog와 동일 이유).
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
          {/* 메모가 이미 비어 있으면 삭제할 대상이 없다 — 무의미한 요청을 막는다. */}
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
