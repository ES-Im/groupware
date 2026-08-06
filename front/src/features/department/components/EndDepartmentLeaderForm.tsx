import { useEffect } from 'react'
import { UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useEndDepartmentLeaderMutation } from '../api/useEndDepartmentLeaderMutation'
import {
  endDepartmentLeaderSchema,
  type EndDepartmentLeaderFormValues,
} from '../model/endDepartmentLeaderSchema'

interface EndDepartmentLeaderFormProps {
  deptId: number
  currentLeaderName: string
}

export function EndDepartmentLeaderForm({ deptId, currentLeaderName }: EndDepartmentLeaderFormProps) {
  const mutation = useEndDepartmentLeaderMutation()
  const form = useZodForm(endDepartmentLeaderSchema, {
    defaultValues: { endAt: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    reset({ endAt: '' })
  }, [deptId, reset])

  async function handleSubmit(values: EndDepartmentLeaderFormValues) {
    await mutation.mutateAsync({ deptId, endAt: values.endAt })
    toast.success('부서장을 종료했습니다')
    reset({ endAt: '' })
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <UserCog className="size-4" aria-hidden />
          </span>
          부서장 관리
        </h3>
        <Button type="submit" variant="destructive" disabled={isSubmitting} className="shrink-0">
          부서장 종료
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        현재 부서장(<span className="font-medium text-foreground">{currentLeaderName}</span>)의 임기 종료일을 선택합니다.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leader-end-at">
          종료일 <span className="text-destructive">*</span>
        </Label>
        <Input id="leader-end-at" type="date" aria-invalid={!!errors.endAt} {...register('endAt')} />
        {errors.endAt && (
          <p role="alert" className="text-sm text-destructive">
            {errors.endAt.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
    </form>
  )
}
