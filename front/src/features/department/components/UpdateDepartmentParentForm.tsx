import { useEffect } from 'react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { useDepartmentsQuery } from '../api/useDepartmentsQuery'
import { useUpdateDepartmentParentMutation } from '../api/useUpdateDepartmentParentMutation'
import {
  updateDepartmentParentSchema,
  type UpdateDepartmentParentFormValues,
} from '../model/updateDepartmentParentSchema'

const CANDIDATE_PAGE_SIZE = 100

interface UpdateDepartmentParentFormProps {
  deptId: number
  currentParentDeptId: number | null
}

export function UpdateDepartmentParentForm({ deptId, currentParentDeptId }: UpdateDepartmentParentFormProps) {
  const mutation = useUpdateDepartmentParentMutation()
  const candidatesQuery = useDepartmentsQuery({ isActive: true, size: CANDIDATE_PAGE_SIZE })
  const form = useZodForm(updateDepartmentParentSchema, {
    defaultValues: { parentDeptId: currentParentDeptId !== null ? String(currentParentDeptId) : '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    reset({ parentDeptId: currentParentDeptId !== null ? String(currentParentDeptId) : '' })
  }, [deptId, currentParentDeptId, candidatesQuery.isSuccess, reset])

  useEffect(() => {
    if (!candidatesQuery.error) {
      return
    }
    toast.error(normalizeApiError(candidatesQuery.error).message)
  }, [candidatesQuery.error])

  const candidates = (candidatesQuery.data?.content ?? []).filter(
    (candidate) => candidate.deptInfoResponse.deptId !== deptId,
  )

  const isCurrentParentMissingFromCandidates =
    currentParentDeptId !== null &&
    !candidates.some((candidate) => candidate.deptInfoResponse.deptId === currentParentDeptId)

  async function handleSubmit(values: UpdateDepartmentParentFormValues) {
    if (values.parentDeptId === '') {
      await mutation.mutateAsync({ deptId })
    } else {
      await mutation.mutateAsync({ deptId, parentDeptId: Number(values.parentDeptId) })
    }
    toast.success('상위 부서를 변경했습니다')
    reset({ parentDeptId: values.parentDeptId })
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parent-dept-id">상위 부서</Label>
        <select
          id="parent-dept-id"
          aria-invalid={!!errors.parentDeptId}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('parentDeptId')}
        >
          <option value="">최상위로 이동</option>
          {isCurrentParentMissingFromCandidates && (
            <option value={String(currentParentDeptId)}>
              현재 상위 부서(ID: {currentParentDeptId}, 비활성 또는 목록 범위 밖)
            </option>
          )}
          {candidates.map((candidate) => (
            <option key={candidate.deptInfoResponse.deptId} value={candidate.deptInfoResponse.deptId}>
              {candidate.deptInfoResponse.deptName} ({candidate.deptInfoResponse.deptCode})
            </option>
          ))}
        </select>
        {errors.parentDeptId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.parentDeptId.message}
          </p>
        )}
        {candidatesQuery.isError && (
          <p role="alert" className="text-sm text-destructive">
            후보 목록을 불러오지 못했습니다. 선택지가 불완전할 수 있습니다.
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          상위 부서 변경
        </Button>
      </div>
    </form>
  )
}
