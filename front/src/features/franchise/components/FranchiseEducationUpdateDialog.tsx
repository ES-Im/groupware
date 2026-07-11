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
  /** 다이얼로그 열림 상태(제어형, FranchiseEducationDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  educationId: number
  /** 프리필 기준값(현재 교육 상세, T4.3 useFranchiseEducationDetailQuery 재사용). */
  detail: FranchiseEducationDetail
}

/**
 * 조회 응답은 일시를 date(`yyyy-MM-dd`)/startAt(`HH:mm:ss`) 둘로 쪼개 내려주지만 수정 요청은
 * educationDate(`yyyy-MM-dd'T'HH:mm:ss`) 하나로 받는다 — 프리필·diff 비교 양쪽에서 동일하게
 * 합성해 기준을 맞춘다.
 */
function toEducationDate(detail: FranchiseEducationDetail): string {
  return `${detail.date}T${detail.startAt}`
}

/**
 * 변경된 필드만 담아 PATCH 페이로드를 구성한다(FranchiseUpdateDialog의 buildUpdatePayload와
 * 동일 패턴). 아무 필드도 바뀌지 않으면 빈 payload가 되고, 그대로 제출되어 서버의
 * "변경값 없음" 거부가 submitWithErrorMapping을 통해 노출된다.
 */
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

/**
 * 교육 수정 다이얼로그(F1613, `FRANCHISE_EDUCATION_UPDATE`, ROADMAP(FRANCHISE) T4.4).
 *
 * 전 필드 부분 수정(optional) — 열릴 때 현재 상세값으로 프리필하고, 제출 시 변경된 필드만
 * 골라 보낸다(FranchiseUpdateDialog·MeetingRoomUpdateDialog 동형). 등록자 본인/비활성/신청자
 * 0명 판정은 서버 403·도메인 에러 전담(Open Q#6)이라 여기서는 검증하지 않는다.
 *
 * educationDate는 `<input type="datetime-local" step={1}>`을 쓰되, 브라우저가 초 없이
 * `yyyy-MM-ddTHH:mm`을 방출하는 경우를 setValueAs에서 `:00` 보정한다(스키마 JSDoc 지침).
 * capacity는 valueAsNumber 대신 setValueAs로 빈 문자열을 undefined로 변환한다
 * (meetingRoomUpdateSchema JSDoc 함정 — 빈 입력이 NaN으로 검증 실패하는 것을 막는다).
 */
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

  // 열릴 때마다 현재 상세값으로 프리필하고, 닫힐 때는 다음 오픈에 이전 입력값/에러가 남지 않도록
  // 리셋한다(FranchiseUpdateDialog와 동일 이유 — 제어형 다이얼로그는 언마운트되지 않는다).
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

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다
  // (FranchiseUpdateDialog와 동일 이유).
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
