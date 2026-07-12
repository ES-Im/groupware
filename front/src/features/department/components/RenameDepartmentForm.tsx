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
  /** 입력값 초기값으로 채울 현재 부서명. */
  currentName: string
}

/**
 * 부서명 변경 인라인 폼(F206, `DEPT_UPDATE_NAME`, ADMIN 전용).
 *
 * 과거 모달(RenameDepartmentDialog)에서 Dialog 껍데기만 벗겨내 관리 패널 탭 콘텐츠로 인라인화했다.
 * zod 스키마(updateDepartmentNameSchema)·mutation·submitWithErrorMapping 검증/에러 매핑은 그대로다.
 * 모달이 아니라 항상 렌더되므로, 선택 부서가 바뀔 때(deptId/currentName 변경)마다 현재값으로 reset한다.
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.detail(deptId)를 invalidate(상세 재조회)하고,
 * 이 폼은 성공 토스트를 띄운 뒤 방금 제출한 값으로 reset해 dirty 상태를 정리한다.
 */
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

  // 선택 부서가 바뀔 때마다 현재 부서명으로 초기화한다 — 트리에서 다른 부서를 고르면
  // 폼도 새 부서의 현재값으로 리셋돼야 한다(모달 시절 open 트랜지션 reset을 대체).
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
