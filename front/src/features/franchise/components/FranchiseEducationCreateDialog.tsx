import { useEffect } from 'react'
import { useNavigate } from 'react-router'
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
import { useFranchiseEducationCreateMutation } from '../api/useFranchiseEducationCreateMutation'
import {
  franchiseEducationCreateSchema,
  type FranchiseEducationCreateFormValues,
} from '../model/franchiseEducationCreateSchema'

interface FranchiseEducationCreateDialogProps {
  /** 다이얼로그 열림 상태(제어형, FranchiseEducationCalendarPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 교육 등록 다이얼로그(`FRANCHISE_EDUCATION_CREATE`, F1612, ROADMAP(FRANCHISE) T4.2).
 *
 * MeetingRoomCreateDialog와 동형인 useZodForm/submitWithErrorMapping 표준 폼 패턴이다.
 * educationDate(날짜)+educationTime(시각) 두 로컬 필드로 입력받아 제출 시
 * `${date}T${time}:00`(yyyy-MM-dd'T'HH:mm:ss) 형태로 조합해 전송한다(HTML time input이 초 단위를
 * 반환하지 않아 `:00` 고정 보정 필요). 성공(201 {educationId}) 시 mutation이 교육 캘린더 캐시를
 * invalidate하므로, 이 컴포넌트는 성공 토스트 + 다이얼로그 닫기 + 생성된 교육의 P5(상세) 이동만
 * 담당한다(첨부·활성화 유도).
 */
export function FranchiseEducationCreateDialog({ open, onOpenChange }: FranchiseEducationCreateDialogProps) {
  const navigate = useNavigate()
  const mutation = useFranchiseEducationCreateMutation()
  const form = useZodForm(franchiseEducationCreateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 폼을 비우고, 닫힐 때는 다음 오픈에 이전 입력값/에러가 남지 않도록 리셋한다
  // (MeetingRoomCreateDialog와 동일 이유 — 제어형 다이얼로그는 언마운트되지 않는다).
  useEffect(() => {
    if (open) {
      reset({ educationDate: '', educationTime: '', place: '', title: '', content: '', capacity: undefined })
    } else {
      reset()
    }
  }, [open, reset])

  async function handleSubmit(values: FranchiseEducationCreateFormValues) {
    const educationDate = `${values.educationDate}T${values.educationTime}:00`
    const result = await mutation.mutateAsync({
      educationDate,
      place: values.place,
      title: values.title,
      content: values.content,
      capacity: values.capacity,
    })
    toast.success('교육을 등록했습니다')
    onOpenChange(false)
    navigate(`/franchise-educations/${result.educationId}`)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다
  // (MeetingRoomCreateDialog와 동일 이유 — 그 사이 닫히면 폼이 reset()되어 뒤늦게 도착하는
  // 등록 실패가 삼켜진다).
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
          <DialogTitle>교육 등록</DialogTitle>
          <DialogDescription>새 교육의 일시·장소·제목·내용·정원을 입력해 등록합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="franchise-education-create-date">
                교육 날짜 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="franchise-education-create-date"
                type="date"
                aria-invalid={!!errors.educationDate}
                {...register('educationDate')}
              />
              {errors.educationDate && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.educationDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="franchise-education-create-time">
                시작 시각 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="franchise-education-create-time"
                type="time"
                aria-invalid={!!errors.educationTime}
                {...register('educationTime')}
              />
              {errors.educationTime && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.educationTime.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="franchise-education-create-place">
              교육 장소 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-education-create-place"
              maxLength={50}
              placeholder="예: 본사 3층 교육장"
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
            <Label htmlFor="franchise-education-create-title">
              교육 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-education-create-title"
              maxLength={50}
              placeholder="예: 신규 가맹점 운영 교육"
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
            <Label htmlFor="franchise-education-create-content">
              교육 내용 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="franchise-education-create-content"
              placeholder="교육 내용을 입력해주세요"
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
            <Label htmlFor="franchise-education-create-capacity">
              정원 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="franchise-education-create-capacity"
              type="number"
              min={1}
              step={1}
              placeholder="예: 20"
              aria-invalid={!!errors.capacity}
              {...register('capacity', { valueAsNumber: true })}
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
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
