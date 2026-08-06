import { useEffect } from 'react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useUpdateDepartmentNameMutation } from '../api/useUpdateDepartmentNameMutation'
import {
  updateDepartmentNameSchema,
  type UpdateDepartmentNameFormValues,
} from '../model/updateDepartmentNameSchema'

interface RenameDepartmentFormProps {
  deptId: number
  currentName: string
}

export function RenameDepartmentForm({ deptId, currentName }: RenameDepartmentFormProps) {
  const mutation = useUpdateDepartmentNameMutation()
  const form = useZodForm(updateDepartmentNameSchema, {
    defaultValues: { newName: currentName },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form

  useEffect(() => {
    reset({ newName: currentName })
  }, [deptId, currentName, reset])

  async function handleSubmit(values: UpdateDepartmentNameFormValues) {
    await mutation.mutateAsync({ deptId, newName: values.newName })
    toast.success('부서명을 변경했습니다')
    reset({ newName: values.newName })
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dept-new-name">
          부서명 <span className="text-destructive">*</span>
        </Label>
        <Input id="dept-new-name" placeholder="부서명" aria-invalid={!!errors.newName} {...register('newName')} />
        {errors.newName && (
          <p role="alert" className="text-sm text-destructive">
            {errors.newName.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || !isDirty}
          onClick={() => reset({ newName: currentName })}
        >
          초기화
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          변경
        </Button>
      </div>
    </form>
  )
}
