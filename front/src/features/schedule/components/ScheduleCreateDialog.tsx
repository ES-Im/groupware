import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
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
import { useCreateManualScheduleMutation } from '../api/useCreateManualScheduleMutation'
import {
  manualScheduleCreateSchema,
  type ManualScheduleCreateFormValues,
} from '../model/manualScheduleCreateSchema'
import { scheduleKeys } from '../model/scheduleKeys'

interface ScheduleCreateDialogProps {
  /** 다이얼로그 열림 상태(제어형, 오픈 트리거는 T3.4가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * 캘린더 날짜 클릭으로 열 때 시작 일시 프리필 기본값(datetime-local 포맷 'YYYY-MM-DDTHH:mm').
   * 지정 시 종료 일시는 +1시간으로 채운다. 미지정([새 일정 등록] 버튼)이면 빈 값으로 연다.
   */
  defaultStartAt?: string
}

/**
 * 수기 일정 등록 다이얼로그(F003 `MANUAL_SCHEDULE_CREATE`, ROADMAP(SCHEDULE) T3.3).
 *
 * MeetingRoomCreateDialog와 동형인 useZodForm/submitWithErrorMapping 표준 폼 패턴이다.
 * startAt/endAt은 `type="datetime-local"` 입력(분 단위, 초 없음)을 그대로 등록하고, 제출 시에만
 * API 계약(full datetime `yyyy-MM-dd'T'HH:mm:ss`)에 맞춰 초(`:00`)를 보정한다 — 초 보정을
 * 소비처가 수행한다는 manualScheduleCreateSchema.ts의 책임 분담 주석 그대로다.
 *
 * 성공(201 {sourceKey}) 시 scheduleKeys.calendar()를 invalidate해 캘린더가 새 일정을 반영하게
 * 하고, 성공 토스트 + 다이얼로그 닫기까지 담당한다. 폼 리셋은 별도 호출 없이 open 전이 useEffect가
 * 담당한다(닫힘 시 reset() → 다음 오픈 시 빈 값으로 다시 채움, MeetingRoomCreateDialog와 동일
 * 이유 — 제어형 다이얼로그는 언마운트되지 않는다). 종료<시작 등 서버 도메인 위반은
 * submitWithErrorMapping → handleApiError가 자연히 처리한다(별도 분기 없음).
 */
export function ScheduleCreateDialog({ open, onOpenChange, defaultStartAt }: ScheduleCreateDialogProps) {
  const queryClient = useQueryClient()
  const mutation = useCreateManualScheduleMutation()
  const form = useZodForm(manualScheduleCreateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      const startAt = defaultStartAt ?? ''
      const endAt = defaultStartAt ? dayjs(defaultStartAt).add(1, 'hour').format('YYYY-MM-DDTHH:mm') : ''
      reset({ title: '', content: '', startAt, endAt })
    } else {
      reset()
    }
  }, [open, reset, defaultStartAt])

  async function handleSubmit(values: ManualScheduleCreateFormValues) {
    await mutation.mutateAsync({
      title: values.title,
      content: values.content,
      startAt: `${values.startAt}:00`,
      endAt: `${values.endAt}:00`,
    })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
    toast.success('일정이 등록되었습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부 무시한다
  // (MeetingReservationUpdateDialog와 동일 이유 — 뒤늦게 도착하는 서버 위반 실패가 삼켜지지 않도록).
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
          <DialogTitle>일정 등록</DialogTitle>
          <DialogDescription>제목·내용과 시작/종료 일시를 입력해 일정을 등록합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schedule-create-title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input id="schedule-create-title" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schedule-create-content">
              내용 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="schedule-create-content"
              aria-invalid={!!errors.content}
              {...register('content')}
            />
            {errors.content && (
              <p role="alert" className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-create-start">
                시작 일시 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="schedule-create-start"
                type="datetime-local"
                aria-invalid={!!errors.startAt}
                {...register('startAt')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-create-end">
                종료 일시 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="schedule-create-end"
                type="datetime-local"
                aria-invalid={!!errors.endAt}
                {...register('endAt')}
              />
            </div>
          </div>
          {(errors.startAt ?? errors.endAt) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.startAt?.message ?? errors.endAt?.message}
            </p>
          )}

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
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
