import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useEducationFileUploadMutation } from '../api/useEducationFileUploadMutation'
import { useFranchiseEducationCreateMutation } from '../api/useFranchiseEducationCreateMutation'
import { EducationFileValidationError, validateEducationFileUpload } from '../lib/educationFileValidation'
import {
  franchiseEducationCreateSchema,
  type FranchiseEducationCreateFormValues,
} from '../model/franchiseEducationCreateSchema'

interface FranchiseEducationCreateFormProps {
  onCancel: () => void
  onSuccess: (educationId: number) => void
}

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FranchiseEducationCreateForm({
  onCancel,
  onSuccess,
}: FranchiseEducationCreateFormProps) {
  const mutation = useFranchiseEducationCreateMutation()
  const uploadMutation = useEducationFileUploadMutation()
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

  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  function handleStagedFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    const combined = [...stagedFiles, ...selected]
    try {
      validateEducationFileUpload(combined, [])
    } catch (error) {
      if (error instanceof EducationFileValidationError) {
        toast.error(error.message)
        return
      }
      throw error
    }
    setStagedFiles(combined)
  }

  function handleRemoveStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(values: FranchiseEducationCreateFormValues) {
    const educationDate = `${values.educationDate}T${values.educationTime}:00`
    const result = await mutation.mutateAsync({
      educationDate,
      place: values.place,
      title: values.title,
      content: values.content,
      capacity: values.capacity,
    })

    if (stagedFiles.length > 0) {
      try {
        await uploadMutation.mutateAsync({ educationId: result.id, files: stagedFiles })
      } catch {
        toast.error('교육은 등록되었습니다. 첨부파일은 교육 상세 화면에서 다시 업로드해주세요')
        onSuccess(result.id)
        return
      }
    }

    toast.success('교육을 등록했습니다')
    onSuccess(result.id)
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

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label>첨부파일</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleStagedFileInputChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus />
          파일 추가
        </Button>
        {stagedFiles.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {stagedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {file.name}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatFileSizeMb(file.size)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveStagedFile(index)}
                    aria-label={`${file.name} 제거`}
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">선택된 첨부파일이 없습니다.</p>
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
