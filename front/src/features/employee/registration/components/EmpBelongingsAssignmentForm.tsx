import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { empBelongingsFormSchema, type EmpBelongingsFormValues } from '../model/empBelongingsFormSchema'
import { positionLabels } from '../model/positionCode'

const CANDIDATE_PAGE_SIZE = 100

interface EmpBelongingsAssignmentFormProps {
  defaultStartAt: string
  onSubmit: (values: EmpBelongingsFormValues) => Promise<void>
}

export function EmpBelongingsAssignmentForm({ defaultStartAt, onSubmit }: EmpBelongingsAssignmentFormProps) {
  const departmentsQuery = useDepartmentsQuery({ isActive: true, size: CANDIDATE_PAGE_SIZE })
  const form = useZodForm(empBelongingsFormSchema, {
    defaultValues: { deptId: '', position: '', isPrimary: true, startAt: defaultStartAt },
  })

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  const departments = departmentsQuery.data?.content ?? []

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="belongings-dept-id">부서</Label>
        <select
          id="belongings-dept-id"
          aria-invalid={!!errors.deptId}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('deptId')}
        >
          <option value="">부서 선택</option>
          {departments.map((candidate) => (
            <option key={candidate.deptInfoResponse.deptId} value={candidate.deptInfoResponse.deptId}>
              {candidate.deptInfoResponse.deptName}
            </option>
          ))}
        </select>
        {errors.deptId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.deptId.message}
          </p>
        )}
        {departmentsQuery.isError && (
          <p role="alert" className="text-sm text-destructive">
            부서 목록을 불러오지 못했습니다. 선택지가 불완전할 수 있습니다.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="belongings-position">직급</Label>
        <select
          id="belongings-position"
          aria-invalid={!!errors.position}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('position')}
        >
          <option value="">직급 선택</option>
          {Object.entries(positionLabels).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        {errors.position && (
          <p role="alert" className="text-sm text-destructive">
            {errors.position.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="belongings-is-primary">주요소속</Label>
        <div className="flex items-center gap-2">
          <Checkbox id="belongings-is-primary" checked disabled />
          <span className="text-sm text-muted-foreground">신규 소속은 항상 주요 소속으로 등록됩니다.</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="belongings-start-at">발령시작일</Label>
        <Input
          id="belongings-start-at"
          type="date"
          aria-invalid={!!errors.startAt}
          {...register('startAt')}
        />
        {errors.startAt && (
          <p role="alert" className="text-sm text-destructive">
            {errors.startAt.message}
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
          소속 등록
        </Button>
      </div>
    </form>
  )
}
