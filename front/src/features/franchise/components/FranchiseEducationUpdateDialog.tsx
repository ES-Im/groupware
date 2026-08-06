import { useEffect } from 'react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
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
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import type { FranchiseEducationUpdatePayload } from '../api/updateFranchiseEducation'
import { useFranchiseEducationUpdateMutation } from '../api/useFranchiseEducationUpdateMutation'
import type { FranchiseEducationDetail } from '../model/franchise'
import {
  franchiseEducationUpdateSchema,
  type FranchiseEducationUpdateFormValues,
} from '../model/franchiseEducationUpdateSchema'

interface FranchiseEducationUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  educationId: number
  detail: FranchiseEducationDetail
}

function toEducationDate(detail: FranchiseEducationDetail): string {
  return `${detail.date}T${detail.startAt}`
}

function buildUpdatePayload(
  values: FranchiseEducationUpdateFormValues,
  detail: FranchiseEducationDetail,
): FranchiseEducationUpdatePayload {
  const payload: FranchiseEducationUpdatePayload = {}
  if (values.educationDate !== undefined && values.educationDate !== toEducationDate(detail)) {
    payload.educationDate = values.educationDate
  }
  if (values.place !== undefined && values.place !== detail.place) {
    payload.place = values.place
  }
  if (values.title !== undefined && values.title !== detail.title) {
    payload.title = values.title
  }
  if (values.content !== undefined && values.content !== detail.content) {
    payload.content = values.content
  }
  if (values.capacity !== undefined && values.capacity !== detail.capacity) {
    payload.capacity = values.capacity
  }
  return payload
}

export function FranchiseEducationUpdateDialog({
  open,
  onOpenChange,
  educationId,
  detail,
}: FranchiseEducationUpdateDialogProps) {
  const mutation = useFranchiseEducationUpdateMutation()
  const form = useZodForm(franchiseEducationUpdateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({
        educationDate: toEducationDate(detail),
        place: detail.place,
        title: detail.title,
        content: detail.content,
        capacity: detail.capacity,
      })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  async function handleSubmit(values: FranchiseEducationUpdateFormValues) {
    const payload = buildUpdatePayload(values, detail)
    await mutation.mutateAsync({ educationId, payload })
    toast.success('교육 정보를 수정했습니다')
    onOpenChange(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>교육 수정</DialogTitle>
          <DialogDescription>바꾸고 싶은 항목만 고쳐 저장합니다. 변경한 값이 없으면 저장할 수 없습니다.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-education-update-date">교육 일시</Label>
            <Input
              id="franchise-education-update-date"
              type="datetime-local"
              step={1}
              aria-invalid={!!errors.educationDate}
              {...register('educationDate', {
                setValueAs: (v: string) =>
                  v === '' ? undefined : v.length === 16 ? `${v}:00` : v,
              })}
            />
            {errors.educationDate && (
              <p role="alert" className="text-sm text-destructive">
                {errors.educationDate.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-education-update-place">장소</Label>
            <Input
              id="franchise-education-update-place"
              aria-invalid={!!errors.place}
              {...register('place')}
            />
            {errors.place && (
              <p role="alert" className="text-sm text-destructive">
                {errors.place.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-education-update-title">제목</Label>
            <Input
              id="franchise-education-update-title"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-education-update-content">내용</Label>
            <Textarea
              id="franchise-education-update-content"
              aria-invalid={!!errors.content}
              {...register('content')}
            />
            {errors.content && (
              <p role="alert" className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-education-update-capacity">정원</Label>
            <Input
              id="franchise-education-update-capacity"
              type="number"
              min={1}
              step={1}
              aria-invalid={!!errors.capacity}
              {...register('capacity', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            {errors.capacity && (
              <p role="alert" className="text-sm text-destructive">
                {errors.capacity.message}
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
  )
}
