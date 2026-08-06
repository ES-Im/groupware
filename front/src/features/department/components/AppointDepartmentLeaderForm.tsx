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
  members: DeptMemberResponse[]
}

function LeaderMemberPickerDialog({
  members,
  selectedEmpId,
  onSelect,
  disabled,
  invalid,
}: {
  members: DeptMemberResponse[]
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
