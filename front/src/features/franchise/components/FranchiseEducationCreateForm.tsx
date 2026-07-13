import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useFranchiseEducationCreateMutation } from '../api/useFranchiseEducationCreateMutation'
import {
  franchiseEducationCreateSchema,
  type FranchiseEducationCreateFormValues,
} from '../model/franchiseEducationCreateSchema'

interface FranchiseEducationCreateFormProps {
  /** 취소(폼 이탈) 시 호출. 상위 페이지가 목록으로 되돌린다. */
  onCancel: () => void
  /** 등록 성공 시 생성된 교육 식별자와 함께 호출. 상위 페이지가 상세로 이동한다. */
  onSuccess: (educationId: number) => void
}

/**
 * 교육 등록 폼(`FRANCHISE_EDUCATION_CREATE`, F1612, ROADMAP(FRANCHISE) T4.2).
 *
 * 기존 FranchiseEducationCreateDialog의 폼 로직을 그대로 옮겨 전용 페이지(FranchiseEducationCreatePage)에서
 * 재사용한다(BoardCreateForm 분리 패턴 동형 — 페이지 chrome과 폼 본문을 분리). useZodForm/submitWithErrorMapping
 * 표준 폼 패턴이며, educationDate(날짜)+educationTime(시각) 두 필드로 입력받아 제출 시
 * `${date}T${time}:00`(yyyy-MM-dd'T'HH:mm:ss)로 조합해 전송한다(HTML time input이 초 단위를 반환하지 않아
 * `:00` 고정 보정). 성공(201 {educationId}) 시 mutation이 교육 캘린더 캐시를 invalidate하고, 이 컴포넌트는
 * 성공 토스트 + onSuccess(educationId) 위임만 담당한다.
 */
export function FranchiseEducationCreateForm({
  onCancel,
  onSuccess,
}: FranchiseEducationCreateFormProps) {
  const mutation = useFranchiseEducationCreateMutation()
  const form = useZodForm(franchiseEducationCreateSchema, {
    defaultValues: {
      educationDate: '',
      educationTime: '',
      place: '',
      title: '',
      content: '',
      capacity: undefined,
    },
  })

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

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
    onSuccess(result.educationId)
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2"
    >
      {/* 교육 제목: 전체 폭(레퍼런스 form-grid의 .fld.full). */}
      <div className="flex flex-col gap-1.5 sm:col-span-2">
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

      {/* 교육 내용: 전체 폭. */}
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="franchise-education-create-content">
          교육 내용 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="franchise-education-create-content"
          rows={5}
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

      {errors.root && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {errors.root.message}
        </p>
      )}

      {/* 하단 액션: 전체 폭 우측 정렬(레퍼런스 등록 폼 하단 버튼 바). */}
      <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          등록
        </Button>
      </div>
    </form>
  )
}
