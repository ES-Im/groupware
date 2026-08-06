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
  onCancel: () => void
  onSuccess: (educationId: number) => void
}

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
