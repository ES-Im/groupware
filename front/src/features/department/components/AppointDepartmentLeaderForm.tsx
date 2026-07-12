import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, UserCog, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useAppointDepartmentLeaderMutation } from '../api/useAppointDepartmentLeaderMutation'
import {
  appointDepartmentLeaderSchema,
  type AppointDepartmentLeaderFormValues,
} from '../model/appointDepartmentLeaderSchema'
import type { DeptMemberResponse } from '../model/deptMember'

interface AppointDepartmentLeaderFormProps {
  deptId: number
  /** 부서장 후보 목록. 현재 페이지에 로드된 부서 멤버(DEPT_MEMBERS 응답)를 그대로 사용한다. */
  members: DeptMemberResponse[]
}

/**
 * 부서장 지정 사원 선택 다이얼로그. 후보(members)는 이미 해당 부서 소속으로만 좁혀져 있으므로
 * 별도 쿼리 없이 prop 그대로를 클라이언트 사이드로 검색·필터링해 1명만 고른다(백엔드
 * `Dept.appointLeader()`가 "부서장은 해당 부서의 현재 소속 사원이어야 합니다"를 강제하므로
 * 타 부서 사원은 애초에 노출하지 않는다). 행 클릭 시 선택하고 다이얼로그를 닫는다.
 */
function LeaderMemberPickerDialog({
  members,
  selectedEmpId,
  onSelect,
  disabled,
  invalid,
}: {
  members: DeptMemberResponse[]
  /** RHF에 저장된 현재 선택값(문자열 empId). 미선택이면 빈 문자열. */
  selectedEmpId: string
  onSelect: (member: DeptMemberResponse) => void
  disabled: boolean
  invalid: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()
  const filteredMembers = useMemo(() => {
    if (normalizedQuery === '') {
      return members
    }
    return members.filter(
      (member) =>
        member.empName.toLowerCase().includes(normalizedQuery) ||
        member.empNo.toLowerCase().includes(normalizedQuery),
    )
  }, [members, normalizedQuery])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    // 닫힐 때 검색어를 비워 다음에 열 때 이전 검색이 남지 않게 한다.
    if (!nextOpen) {
      setQuery('')
    }
  }

  function handlePick(member: DeptMemberResponse) {
    onSelect(member)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          id="leader-emp-id"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            'flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm text-foreground transition-colors',
            'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-input/30',
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate text-muted-foreground">사원 선택</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>부서장 지정 사원 선택</DialogTitle>
          <DialogDescription>현재 부서 소속 사원 중에서 부서장으로 지정할 1명을 선택합니다.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름 또는 사번으로 검색"
            aria-label="사원 검색"
          />
          {filteredMembers.length > 0 ? (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {filteredMembers.map((member) => {
                const isSelected = String(member.empId) === selectedEmpId
                return (
                  <li key={member.empId}>
                    <button
                      type="button"
                      onClick={() => handlePick(member)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-colors',
                        'hover:bg-muted focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        isSelected && 'border-border bg-muted',
                      )}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {member.empName}
                          <span className="ml-1.5 font-normal text-muted-foreground">{member.position}</span>
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {member.empNo} · {member.email}
                        </span>
                      </span>
                      {isSelected && <Check className="ml-auto size-4 shrink-0 text-foreground" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 부서장 지정 인라인 폼(F208, `DEPT_APPOINT_LEADER`, ADMIN 전용).
 *
 * "부서장으로 지정할 사원" 입력은 네이티브 `<select>` 대신 전용 다이얼로그(LeaderMemberPickerDialog)로
 * 고른다. 후보는 현재 부서 멤버(members prop)로만 좁혀져 있어(백엔드가 타 부서 사원 지정을 거부) 별도
 * 쿼리 없이 클라이언트 사이드 검색만 얹는다. 선택값은 RHF의 setValue로 leaderEmpId에 프로그래밍적으로
 * 세팅하고, zod/mutation/에러 매핑은 그대로 유지한다.
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.detail(deptId)를 invalidate(상세 재조회)하고,
 * 이 폼은 성공 토스트를 띄운 뒤 입력값을 비운다.
 */
export function AppointDepartmentLeaderForm({ deptId, members }: AppointDepartmentLeaderFormProps) {
  const mutation = useAppointDepartmentLeaderMutation()
  const form = useZodForm(appointDepartmentLeaderSchema, {
    defaultValues: { leaderEmpId: '', appointedAt: '' },
  })

  const {
    register,
    reset,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

  // 선택 부서가 바뀌면 이전 부서에서 고르던 사원/지정일·에러를 비운다.
  useEffect(() => {
    reset({ leaderEmpId: '', appointedAt: '' })
  }, [deptId, reset])

  const selectedEmpId = watch('leaderEmpId')
  const selectedMember = members.find((member) => String(member.empId) === selectedEmpId) ?? null

  function handleSelectLeader(member: DeptMemberResponse) {
    setValue('leaderEmpId', String(member.empId))
    clearErrors('leaderEmpId')
  }

  async function handleSubmit(values: AppointDepartmentLeaderFormValues) {
    await mutation.mutateAsync({
      deptId,
      leaderEmpId: Number(values.leaderEmpId),
      appointedAt: values.appointedAt,
    })
    toast.success('부서장을 지정했습니다')
    reset({ leaderEmpId: '', appointedAt: '' })
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="flex flex-col gap-4"
    >
      {/* 섹션 타이틀 줄: 좌측 헤딩 + 우측 제출 버튼. 버튼이 폼의 isSubmitting에 접근해야 하므로 헤딩을 폼이 소유한다. */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <UserCog className="size-4" aria-hidden />
          </span>
          부서장 관리
        </h3>
        <Button type="submit" disabled={isSubmitting} className="shrink-0">
          부서장 지정
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leader-emp-id">
          부서장으로 지정할 사원 <span className="text-destructive">*</span>
        </Label>
        {/* RHF가 leaderEmpId를 추적하도록 hidden input으로 등록하고, 값은 다이얼로그 선택으로 setValue한다. */}
        <input type="hidden" {...register('leaderEmpId')} />
        <LeaderMemberPickerDialog
          members={members}
          selectedEmpId={selectedEmpId}
          onSelect={handleSelectLeader}
          disabled={members.length === 0}
          invalid={!!errors.leaderEmpId}
        />
        {selectedMember ? (
          <p className="text-sm text-foreground">
            선택: <span className="font-medium">{selectedMember.empName}</span>{' '}
            <span className="text-muted-foreground">({selectedMember.empNo})</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">사원을 선택해주세요</p>
        )}
        {members.length === 0 && (
          <p className="text-xs text-muted-foreground">
            현재 부서에 표시된 멤버가 없어 지정할 사원을 선택할 수 없습니다.
          </p>
        )}
        {errors.leaderEmpId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.leaderEmpId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leader-appointed-at">
          지정일 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="leader-appointed-at"
          type="date"
          aria-invalid={!!errors.appointedAt}
          {...register('appointedAt')}
        />
        {errors.appointedAt && (
          <p role="alert" className="text-sm text-destructive">
            {errors.appointedAt.message}
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
