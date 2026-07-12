import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { useDepartmentsQuery } from '@/features/department/api/useDepartmentsQuery'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { empBelongingsFormSchema, type EmpBelongingsFormValues } from '../model/empBelongingsFormSchema'
import { positionLabels } from '../model/positionCode'

/** 후보 목록 조회 시 사용할 페이지 크기. UpdateDepartmentParentForm의 CANDIDATE_PAGE_SIZE 관례를 재사용한다. */
const CANDIDATE_PAGE_SIZE = 100

interface EmpBelongingsAssignmentFormProps {
  /** startAt 초깃값(1단계에서 입력한 hiredAt)으로 프리필한다. */
  defaultStartAt: string
  onSubmit: (values: EmpBelongingsFormValues) => Promise<void>
}

/**
 * 소속 배정(신규 소속 등록) 2단계 폼(`HR_UPDATE_EMP_BELONGINGS`, ROADMAP M3/F003).
 *
 * useUpdateEmpBelongingsMutation(T3.5)을 직접 참조하지 않는 자체완결형 폼이다 — 실제 mutation
 * 호출은 부모가 주입하는 onSubmit prop에 위임하고(ROADMAP Depends-on이 T3.5를 포함하지 않는 것과
 * 정합), 이 컴포넌트는 useZodForm+submitWithErrorMapping만 내장해 클라이언트 사전검증과 서버 에러의
 * errors.root 매핑까지만 책임진다. 성공 토스트·다이얼로그 닫기는 T3.7의 통합 지점이 담당한다.
 *
 * 부서 후보는 useDepartmentsQuery({isActive:true, size:100})를 재사용한다(신규 조회 훅 생성 금지).
 * 응답이 content[].deptInfoResponse.{deptId,deptName} 구조라(UpdateDepartmentParentForm.tsx 실측),
 * 후보 목록도 동일하게 소비한다.
 *
 * isPrimary는 이 폼에서 등록하는 소속이 항상 주요 소속이라(empBelongingsFormSchema의 z.literal(true))
 * 사용자가 바꿀 수 없도록 UI도 disabled checked 체크박스로 고정한다.
 */
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
          {/* todo : positionLabels를 그대로 렌더하면 NONE('미지정')이 선택 가능한 option이 되어 z.string().min(1)을 통과한다. 스키마 주석은 NONE을 '아직 고르지 않음' placeholder(유효한 선택지 아님)로 규정하므로, 옵션에서 NONE을 제외할지(빈 placeholder와 NONE의 역할 충돌) 확정 필요. 실제 배제 로직/스키마 수정 위치는 이번 범위 밖일 수 있음. */}
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
