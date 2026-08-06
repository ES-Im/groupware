import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Textarea } from '@/shared/ui/textarea'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { useAddScheduleParticipantsMutation } from '../api/useAddScheduleParticipantsMutation'
import { useCancelScheduleMutation } from '../api/useCancelScheduleMutation'
import { useRemoveScheduleParticipantsMutation } from '../api/useRemoveScheduleParticipantsMutation'
import { useScheduleDetailQuery } from '../api/useScheduleDetailQuery'
import { useUpdateManualScheduleMutation } from '../api/useUpdateManualScheduleMutation'
import type { ScheduleDetailResponse, ScheduleScope } from '../lib/scheduleTypes'
import {
  manualScheduleUpdateSchema,
  type ManualScheduleUpdateFormValues,
} from '../model/manualScheduleUpdateSchema'
import { scheduleKeys } from '../model/scheduleKeys'

interface ScheduleDetailDialogProps {
  scheduleId: number | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DetailMode = 'view' | 'content' | 'datetime' | 'participants'

export function ScheduleDetailDialog({ scheduleId, open, onOpenChange }: ScheduleDetailDialogProps) {
  const { data, isLoading, error } = useScheduleDetailQuery(scheduleId)
  const [mode, setMode] = useState<DetailMode>('view')
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  useEffect(() => {
    if (!error) {
      return
    }
    handleApiError(error, { toast })
  }, [error])

  useEffect(() => {
    if (!open) {
      setMode('view')
      setIsEditSubmitting(false)
    }
  }, [open])

  const canManage = !!data && data.isEditable && data.scheduleType === 'MANUAL' && !data.isCanceled

  function handleBackToView() {
    setMode('view')
    setIsEditSubmitting(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && (mode === 'content' || mode === 'datetime') && isEditSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  const showEditView = !!data && mode !== 'view' && canManage

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>일정 상세</DialogTitle>
          <DialogDescription className="sr-only">일정의 상세 정보를 표시합니다.</DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

        {data && !showEditView && (
          <ScheduleDetailView
            detail={data}
            canManage={canManage}
            onEditContent={() => setMode('content')}
            onEditDatetime={() => setMode('datetime')}
            onEditParticipants={() => setMode('participants')}
            onDeleted={() => onOpenChange(false)}
          />
        )}

        {showEditView && mode === 'content' && (
          <ScheduleEditSection title="본문 수정" isSubmitting={isEditSubmitting} onBack={handleBackToView}>
            <ScheduleContentEditForm
              detail={data}
              onSuccess={handleBackToView}
              onSubmittingChange={setIsEditSubmitting}
            />
          </ScheduleEditSection>
        )}

        {showEditView && mode === 'datetime' && (
          <ScheduleEditSection title="일시 변경" isSubmitting={isEditSubmitting} onBack={handleBackToView}>
            <ScheduleDatetimeEditForm
              detail={data}
              onSuccess={handleBackToView}
              onSubmittingChange={setIsEditSubmitting}
            />
          </ScheduleEditSection>
        )}

        {showEditView && mode === 'participants' && (
          <ScheduleEditSection title="참여자 수정" isSubmitting={false} onBack={handleBackToView}>
            <ScheduleParticipantAddSection detail={data} />
            <ScheduleParticipantRemoveSection detail={data} />
          </ScheduleEditSection>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ScheduleDetailViewProps {
  detail: ScheduleDetailResponse
  canManage: boolean
  onEditContent: () => void
  onEditDatetime: () => void
  onEditParticipants: () => void
  onDeleted: () => void
}

function ScheduleDetailView({
  detail,
  canManage,
  onEditContent,
  onEditDatetime,
  onEditParticipants,
  onDeleted,
}: ScheduleDetailViewProps) {
  const deleteBlocked = detail.participantCount > 1

  return (
    <div className={cn('flex flex-col gap-4', detail.isCanceled && 'opacity-50')}>
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {detail.scheduleType} · {detail.ownerDeptName} {detail.ownerEmpName}
        </p>
        <h3 className="text-lg font-semibold leading-snug">{detail.title}</h3>
      </header>

      <p className="whitespace-pre-wrap text-sm text-muted-foreground empty:hidden">{detail.content}</p>

      <dl className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">일시</dt>
          <dd className="text-right">
            {detail.scheduleDate} {detail.startAt}~{detail.endAt}
            {detail.isAllDay && ' · 종일'}
            {detail.isCanceled && ' · 취소됨'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">참여자</dt>
          <dd>참여자 {detail.participantCount}명</dd>
        </div>
      </dl>

      <ul data-testid="schedule-detail-participants" className="flex flex-wrap gap-1.5 text-sm empty:hidden">
        {detail.participants.map((participant) => (
          <li
            key={participant.empId}
            className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
          >
            {participant.deptName} {participant.empName}
          </li>
        ))}
      </ul>

      {canManage && (
        <footer data-testid="schedule-detail-actions" className="flex flex-col gap-2 border-t pt-4">
          {deleteBlocked && (
            <p className="text-right text-sm text-muted-foreground">
              참가자를 먼저 제외해야 삭제할 수 있습니다.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onEditContent}>
              본문 수정
            </Button>
            <Button type="button" variant="outline" onClick={onEditDatetime}>
              일시 변경
            </Button>
            <Button type="button" variant="outline" onClick={onEditParticipants}>
              참여자 수정
            </Button>
            <ScheduleDeleteAction detail={detail} onDeleted={onDeleted} />
          </div>
        </footer>
      )}
    </div>
  )
}

interface ScheduleDeleteActionProps {
  detail: ScheduleDetailResponse
  onDeleted: () => void
}

function ScheduleDeleteAction({ detail, onDeleted }: ScheduleDeleteActionProps) {
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')
  const mutation = useCancelScheduleMutation()
  const blocked = detail.participantCount > 1

  function handleConfirm() {
    mutation.mutate(
      { scheduleId: detail.scheduleId, scope },
      {
        onSuccess: () => {
          toast.success('일정을 삭제했습니다')
          onDeleted()
        },
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={blocked}>
          일정 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>일정을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>삭제한 일정은 되돌릴 수 없습니다.</AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(value) => setScope(value as ScheduleScope)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SINGLE" id="schedule-delete-scope-single" />
            <Label htmlFor="schedule-delete-scope-single" className="font-normal">
              <span className="sr-only">일정 삭제 적용 범위: </span>이 날짜만
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SERIES" id="schedule-delete-scope-series" />
            <Label htmlFor="schedule-delete-scope-series" className="font-normal">
              <span className="sr-only">일정 삭제 적용 범위: </span>동일 일정 전체
            </Label>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>돌아가기</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? '삭제 처리 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface ScheduleEditSectionProps {
  title: string
  isSubmitting: boolean
  onBack: () => void
  children: ReactNode
}

function ScheduleEditSection({ title, isSubmitting, onBack, children }: ScheduleEditSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ChevronLeft />
          뒤로
        </Button>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>

      {children}

      <div className="flex justify-end border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          뒤로
        </Button>
      </div>
    </div>
  )
}

interface ScheduleEditFormProps {
  detail: ScheduleDetailResponse
  onSuccess: () => void
  onSubmittingChange: (isSubmitting: boolean) => void
}

function ScheduleContentEditForm({ detail, onSuccess, onSubmittingChange }: ScheduleEditFormProps) {
  const queryClient = useQueryClient()
  const mutation = useUpdateManualScheduleMutation()
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')

  const form = useZodForm(manualScheduleUpdateSchema, {
    defaultValues: {
      title: detail.title,
      content: detail.content,
    },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    onSubmittingChange(isSubmitting)
  }, [isSubmitting, onSubmittingChange])

  async function handleSubmit(values: ManualScheduleUpdateFormValues) {
    await mutation.mutateAsync({
      scheduleId: detail.scheduleId,
      payload: { title: values.title, content: values.content },
      scope,
    })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(detail.scheduleId) })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
    toast.success('일정이 수정되었습니다')
    onSuccess()
  }

  return (
    <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schedule-edit-title">제목</Label>
        <Input id="schedule-edit-title" aria-invalid={!!errors.title} {...register('title')} />
        {errors.title && (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schedule-edit-content">내용</Label>
        <Textarea id="schedule-edit-content" aria-invalid={!!errors.content} {...register('content')} />
        {errors.content && (
          <p role="alert" className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>적용 범위</Label>
        <RadioGroup
          value={scope}
          onValueChange={(value) => setScope(value as ScheduleScope)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SINGLE" id="schedule-content-scope-single" />
            <Label htmlFor="schedule-content-scope-single" className="font-normal">
              <span className="sr-only">본문 수정 적용 범위: </span>이 날짜만
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SERIES" id="schedule-content-scope-series" />
            <Label htmlFor="schedule-content-scope-series" className="font-normal">
              <span className="sr-only">본문 수정 적용 범위: </span>동일 일정 전체
            </Label>
          </div>
        </RadioGroup>
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          저장
        </Button>
      </div>
    </form>
  )
}

function ScheduleDatetimeEditForm({ detail, onSuccess, onSubmittingChange }: ScheduleEditFormProps) {
  const queryClient = useQueryClient()
  const mutation = useUpdateManualScheduleMutation()
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')

  const form = useZodForm(manualScheduleUpdateSchema, {
    defaultValues: {
      startAt: detail.startAt.slice(0, 5),
      endAt: detail.endAt.slice(0, 5),
    },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    onSubmittingChange(isSubmitting)
  }, [isSubmitting, onSubmittingChange])

  async function handleSubmit(values: ManualScheduleUpdateFormValues) {
    await mutation.mutateAsync({
      scheduleId: detail.scheduleId,
      payload: {
        startAt: values.startAt ? `${values.startAt}:00` : undefined,
        endAt: values.endAt ? `${values.endAt}:00` : undefined,
      },
      scope,
    })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(detail.scheduleId) })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
    toast.success('일정이 수정되었습니다')
    onSuccess()
  }

  return (
    <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">시작일자</span>
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {detail.scheduleDate}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">종료일자</span>
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {detail.scheduleDate}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        날짜는 변경할 수 없습니다. 날짜를 바꾸려면 일정을 삭제한 뒤 새로 등록하세요.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-edit-start">시작 시각</Label>
          <Input
            id="schedule-edit-start"
            type="time"
            aria-invalid={!!errors.startAt}
            {...register('startAt')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="schedule-edit-end">종료 시각</Label>
          <Input
            id="schedule-edit-end"
            type="time"
            aria-invalid={!!errors.endAt}
            {...register('endAt')}
          />
        </div>
      </div>
      {(errors.startAt ?? errors.endAt) && (
        <p role="alert" className="text-sm text-destructive">
          {errors.startAt?.message ?? errors.endAt?.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>적용 범위</Label>
        <RadioGroup
          value={scope}
          onValueChange={(value) => setScope(value as ScheduleScope)}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SINGLE" id="schedule-datetime-scope-single" />
            <Label htmlFor="schedule-datetime-scope-single" className="font-normal">
              <span className="sr-only">일시 변경 적용 범위: </span>이 날짜만
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="SERIES" id="schedule-datetime-scope-series" />
            <Label htmlFor="schedule-datetime-scope-series" className="font-normal">
              <span className="sr-only">일시 변경 적용 범위: </span>동일 일정 전체
            </Label>
          </div>
        </RadioGroup>
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          저장
        </Button>
      </div>
    </form>
  )
}

interface ScheduleParticipantAddSectionProps {
  detail: ScheduleDetailResponse
}

function ScheduleParticipantAddSection({ detail }: ScheduleParticipantAddSectionProps) {
  const queryClient = useQueryClient()
  const mutation = useAddScheduleParticipantsMutation()
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')

  const disabledEmpIds = [detail.ownerId, ...detail.participants.map((participant) => participant.empId)]

  function handleAdd() {
    mutation.mutate(
      { scheduleId: detail.scheduleId, participantIds: selected.map((employee) => employee.empId), scope },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(detail.scheduleId) })
          toast.success('참여자를 추가했습니다')
          setSelected([])
        },
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">참여자 추가</p>
      <EmployeePicker selected={selected} onChange={setSelected} disabledEmpIds={disabledEmpIds} />

      <RadioGroup
        value={scope}
        onValueChange={(value) => setScope(value as ScheduleScope)}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SINGLE" id="schedule-participant-add-scope-single" />
          <Label htmlFor="schedule-participant-add-scope-single" className="font-normal">
            <span className="sr-only">참여자 추가 적용 범위: </span>이 날짜만
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SERIES" id="schedule-participant-add-scope-series" />
          <Label htmlFor="schedule-participant-add-scope-series" className="font-normal">
            <span className="sr-only">참여자 추가 적용 범위: </span>동일 일정 전체
          </Label>
        </div>
      </RadioGroup>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleAdd} disabled={selected.length === 0 || mutation.isPending}>
          참여자 추가
        </Button>
      </div>
    </div>
  )
}

interface ScheduleParticipantRemoveSectionProps {
  detail: ScheduleDetailResponse
}

function ScheduleParticipantRemoveSection({ detail }: ScheduleParticipantRemoveSectionProps) {
  const queryClient = useQueryClient()
  const mutation = useRemoveScheduleParticipantsMutation()
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([])
  const [scope, setScope] = useState<ScheduleScope>('SINGLE')

  function toggle(empId: number) {
    if (empId === detail.ownerId) {
      return
    }
    setSelectedEmpIds((prev) => (prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]))
  }

  function handleRemove() {
    mutation.mutate(
      { scheduleId: detail.scheduleId, participantIds: selectedEmpIds, scope },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(detail.scheduleId) })
          toast.success('참여자를 제외했습니다')
          setSelectedEmpIds([])
        },
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">참여자 제외</p>
      <ul className="flex flex-col gap-1.5">
        {detail.participants.map((participant) => {
          const isOwner = participant.empId === detail.ownerId
          const inputId = `schedule-participant-remove-${participant.empId}`
          return (
            <li key={participant.empId} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={inputId}
                checked={selectedEmpIds.includes(participant.empId)}
                disabled={isOwner}
                onCheckedChange={() => toggle(participant.empId)}
              />
              <Label htmlFor={inputId} className="font-normal">
                {participant.deptName} {participant.empName}
                {isOwner && ' (소유자)'}
              </Label>
            </li>
          )
        })}
      </ul>

      <RadioGroup
        value={scope}
        onValueChange={(value) => setScope(value as ScheduleScope)}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SINGLE" id="schedule-participant-remove-scope-single" />
          <Label htmlFor="schedule-participant-remove-scope-single" className="font-normal">
            <span className="sr-only">참여자 제외 적용 범위: </span>이 날짜만
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="SERIES" id="schedule-participant-remove-scope-series" />
          <Label htmlFor="schedule-participant-remove-scope-series" className="font-normal">
            <span className="sr-only">참여자 제외 적용 범위: </span>동일 일정 전체
          </Label>
        </div>
      </RadioGroup>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleRemove}
          disabled={selectedEmpIds.length === 0 || mutation.isPending}
        >
          참여자 제외
        </Button>
      </div>
    </div>
  )
}
