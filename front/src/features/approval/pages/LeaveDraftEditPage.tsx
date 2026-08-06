import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import dayjs from 'dayjs'
import { SquarePen } from 'lucide-react'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { addCirculation } from '../api/addCirculation'
import { removeCirculation } from '../api/removeCirculation'
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { useDraftSubmitMutation } from '../api/useDraftSubmitMutation'
import { useLeaveDraftUpdateMutation } from '../api/useLeaveDraftUpdateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { composeLeaveAt, LeaveDateHourField } from '../components/LeaveDateHourField'
import { getApprovalStatusBadge } from '../lib/approvalStatusBadge'
import { isLeaveDraft } from '../lib/isLeaveDraft'
import { useMyLeaveSummaryQuery } from '@/features/leave/api/useMyLeaveSummaryQuery'
import {
  calculateUsedLeaveDays,
  formatLeaveDays,
  isFourHourUnitLeaveType,
  LEAVE_END_HOUR_OPTIONS,
  LEAVE_START_HOUR_OPTIONS,
} from '../lib/leaveHours'
import { resolveDrafterActions } from '../lib/resolveDrafterActions'
import {
  APPROVAL_ROLE_OPTIONS,
  toApprovalRole,
  type ApprovalRole,
  type ApproverParam,
} from '../model/approverParam'
import type { DraftDetailResponse, LeaveSlot } from '../model/draftDetail'
import {
  DRAFT_PRINT_PREVIEW_STORAGE_KEY,
  type DraftPreviewField,
  type DraftPrintPreviewPayload,
} from '../model/draftPreview'
import { leaveDraftSchema, leaveTypeOptions, type LeaveDraftFormValues } from '../model/leaveDraftSchema'

function GuardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">{children}</div>
}

function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

function toDateTimeLocalValue(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm')
}

function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

function LeaveDraftEditForm({
  draftId,
  draft,
  leave,
}: {
  draftId: number
  draft: DraftDetailResponse
  leave: LeaveSlot
}) {
  const navigate = useNavigate()
  const updateMutation = useLeaveDraftUpdateMutation()
  const submitMutation = useDraftSubmitMutation()

  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>(() =>
    Object.fromEntries(
      draft.approvers.map((approver) => [approver.empId, toApprovalRole(approver.role)]),
    ),
  )
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>(() =>
    draft.circulations.map((circulation) => ({
      empId: circulation.empId,
      empName: circulation.empName,
    })),
  )

  const [startDate, setStartDate] = useState(() => dayjs(leave.startAt).format('YYYY-MM-DD'))
  const [startHour, setStartHour] = useState(() => dayjs(leave.startAt).format('HH'))
  const [endDate, setEndDate] = useState(() => dayjs(leave.endAt).format('YYYY-MM-DD'))
  const [endHour, setEndHour] = useState(() => dayjs(leave.endAt).format('HH'))

  const form = useZodForm(leaveDraftSchema, {
    defaultValues: {
      title: draft.title,
      content: draft.content,
      leaveType: leave.leaveType as LeaveDraftFormValues['leaveType'],
      startAt: toDateTimeLocalValue(leave.startAt),
      endAt: toDateTimeLocalValue(leave.endAt),
    },
  })
  const {
    register,
    getValues,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isSubmitted },
  } = form

  const leaveTypeValue = watch('leaveType')
  const isFourHourUnit = isFourHourUnitLeaveType(leaveTypeValue)

  const summaryQuery = useMyLeaveSummaryQuery(startDate ? dayjs(startDate).year() : undefined)
  const leaveSummary =
    summaryQuery.data && typeof summaryQuery.data !== 'string' ? summaryQuery.data : null
  const remainingDaysByType: Record<string, number | null> = {
    ANNUAL: leaveSummary ? leaveSummary.annualBaseGrantDays - leaveSummary.annualUsedDays : null,
    SPECIAL: leaveSummary ? leaveSummary.specialGrantDays - leaveSummary.specialUsedDays : null,
    COMPENSATORY: leaveSummary
      ? leaveSummary.compensatoryGrantDays - leaveSummary.compensatoryUsedDays
      : null,
  }
  const remainingDays = isFourHourUnit ? (remainingDaysByType[leaveTypeValue ?? ''] ?? null) : null

  const usedLeaveDays = isFourHourUnit
    ? calculateUsedLeaveDays(startDate, startHour, endDate, endHour)
    : null

  function handleStartChange(date: string, hour: string) {
    setStartDate(date)
    setStartHour(hour)
    setValue('startAt', composeLeaveAt(date, hour), { shouldValidate: isSubmitted })
  }

  function handleEndChange(date: string, hour: string) {
    setEndDate(date)
    setEndHour(hour)
    setValue('endAt', composeLeaveAt(date, hour), { shouldValidate: isSubmitted })
  }

  useEffect(() => {
    if (!isFourHourUnit) {
      return
    }
    if (startHour && !(LEAVE_START_HOUR_OPTIONS as readonly string[]).includes(startHour)) {
      setStartHour('')
      setValue('startAt', '', { shouldValidate: isSubmitted })
    }
    if (endHour && !(LEAVE_END_HOUR_OPTIONS as readonly string[]).includes(endHour)) {
      setEndHour('')
      setValue('endAt', '', { shouldValidate: isSubmitted })
    }
  }, [isFourHourUnit, startHour, endHour, isSubmitted, setValue])

  function handleApproverSelectionChange(next: EmployeePickerEmployee[]) {
    setApproverSelection(next)
    setApproverRoles((prev) => {
      const retained: Record<number, ApprovalRole> = {}
      for (const emp of next) {
        const role = prev[emp.empId]
        if (role) {
          retained[emp.empId] = role
        }
      }
      return retained
    })
    if (next.length > 0) {
      clearErrors('root')
    }
  }

  function handleApproverRoleChange(empId: number, role: string) {
    setApproverRoles((prev) => ({ ...prev, [empId]: toApprovalRole(role) }))
    clearErrors('root')
  }

  async function reconcileCirculation() {
    const initialIds = new Set(draft.circulations.map((circulation) => circulation.empId))
    const selectedIds = new Set(circulationSelection.map((emp) => emp.empId))
    const toAdd = circulationSelection
      .filter((emp) => !initialIds.has(emp.empId))
      .map((emp) => emp.empId)
    const toRemove = draft.circulations
      .filter((circulation) => !selectedIds.has(circulation.empId))
      .map((circulation) => circulation.empId)
    try {
      if (toAdd.length > 0) {
        await addCirculation(draftId, toAdd)
      }
      for (const empId of toRemove) {
        await removeCirculation(draftId, empId)
      }
    } catch {
      toast.error('공람자 변경 일부가 실패했습니다. 상세 화면에서 다시 시도해주세요')
    }
  }

  async function onValid(values: LeaveDraftFormValues, submit: boolean) {
    if (submit && approverSelection.length === 0) {
      setError('root', { message: '상신하려면 결재선에 최소 1명을 지정해주세요' })
      return
    }
    if (
      submit &&
      !approverSelection.some((emp) => (approverRoles[emp.empId] ?? 'APPROVER') === 'APPROVER')
    ) {
      setError('root', { message: '상신하려면 결재 역할의 결재자가 최소 1명 필요합니다' })
      return
    }

    const approvers: ApproverParam[] | undefined =
      approverSelection.length > 0
        ? approverSelection.map((emp, index) => ({
            approverId: emp.empId,
            role: approverRoles[emp.empId] ?? 'APPROVER',
            order: index + 1,
          }))
        : undefined

    await updateMutation.mutateAsync({
      draftId,
      payload: {
        param: { title: values.title, content: values.content, approvers },
        startAt: toRequestDateTime(values.startAt),
        endAt: toRequestDateTime(values.endAt),
        leaveType: values.leaveType,
      },
    })
    await reconcileCirculation()
    if (submit) {
      await submitMutation.mutateAsync({ draftId })
    }
    toast.success(submit ? '휴가 기안서를 상신했습니다' : '휴가 기안서를 저장했습니다')
    navigate(`/approval/drafts/${draftId}`)
  }

  const handleSave = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleSaveAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  function handlePreview() {
    const values = getValues()
    const previewFields: DraftPreviewField[] = [
      {
        label: '휴가 유형',
        value: leaveTypeOptions.find((option) => option.value === values.leaveType)?.label ?? '',
      },
      {
        label: '휴가 기간',
        value: `${toDisplayDateTime(values.startAt) || '-'} ~ ${toDisplayDateTime(values.endAt) || '-'}`,
      },
    ]
    const payload: DraftPrintPreviewPayload = {
      typeLabel: '연가신청',
      title: values.title,
      content: values.content,
      fields: previewFields,
      approvers: approverSelection.map((emp) => ({
        empId: emp.empId,
        empName: emp.empName,
        role: approverRoles[emp.empId] ?? 'APPROVER',
      })),
      circulations: circulationSelection.map((emp) => ({ empId: emp.empId, empName: emp.empName })),
      attachments: draft.files.map((file) => file.originalName),
    }
    localStorage.setItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY, JSON.stringify(payload))
    window.open('/approval/drafts/preview', '_blank', 'noopener,noreferrer')
  }

  const statusBadge = getApprovalStatusBadge(draft.approvalStatus)

  return (
    <DraftCreateFrame
      currentType="leave"
      title="휴가 기안서 수정"
      subtitle="임시저장된 휴가 기안서를 수정하거나 바로 상신합니다"
      formIcon={SquarePen}
      formTitle="휴가 기안서"
      formDescription="제목·유형·기간·결재선을 수정합니다"
      headerBadge="임시저장 수정"
      sidebar={
        <Card className="h-fit rounded-2xl">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-bold">문서 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">문서번호</dt>
                <dd className="font-semibold">HARUON-DRAFT-{draft.draftId}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">상태</dt>
                <dd>
                  <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">첨부파일</dt>
                <dd className="font-medium">{draft.files.length}개</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              첨부파일은 저장 후 상세 화면에서 관리합니다.
            </p>
          </CardContent>
        </Card>
      }
    >
      <form noValidate onSubmit={handleSaveAndSubmit} className="flex flex-1 flex-col gap-4">
        <div className="grid min-h-0 flex-1 grid-rows-[4fr_1fr] gap-4">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leave-draft-edit-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="leave-draft-edit-title"
                placeholder="제목을 입력해주세요"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leave-draft-edit-type">
                  휴가 유형 <span className="text-destructive">*</span>
                </Label>
                <select
                  id="leave-draft-edit-type"
                  aria-invalid={!!errors.leaveType}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  {...register('leaveType')}
                >
                  {leaveTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isFourHourUnit && (
                  <p className="text-xs text-muted-foreground">
                    연차·특별휴가·대체휴무는 0.5일(4시간) 단위로만 사용할 수 있습니다. 사용 일수는
                    시작·종료 일시로 자동 계산됩니다.
                  </p>
                )}
                {isFourHourUnit && (
                  <p className="text-xs text-muted-foreground">
                    {remainingDays !== null ? (
                      <>
                        잔여{' '}
                        {leaveTypeOptions.find((option) => option.value === leaveTypeValue)?.label}:{' '}
                        <span className="font-medium text-foreground">
                          {formatLeaveDays(remainingDays)}
                        </span>
                        {usedLeaveDays !== null && (
                          <> · 이번 신청 사용: {formatLeaveDays(usedLeaveDays)}</>
                        )}
                      </>
                    ) : (
                      '잔여 휴가 정보를 불러올 수 없습니다.'
                    )}
                  </p>
                )}
                {errors.leaveType && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.leaveType.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <LeaveDateHourField
                id="leave-draft-edit-start-at"
                label="휴가 시작 일시"
                hourAriaLabel="휴가 시작 시간"
                dateValue={startDate}
                hourValue={startHour}
                error={errors.startAt?.message}
                hourOptions={isFourHourUnit ? LEAVE_START_HOUR_OPTIONS : undefined}
                onChange={handleStartChange}
              />

              <LeaveDateHourField
                id="leave-draft-edit-end-at"
                label="휴가 종료 일시"
                hourAriaLabel="휴가 종료 시간"
                dateValue={endDate}
                hourValue={endHour}
                error={errors.endAt?.message}
                hourOptions={isFourHourUnit ? LEAVE_END_HOUR_OPTIONS : undefined}
                onChange={handleEndChange}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="leave-draft-edit-content">
                기안 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="leave-draft-edit-content"
                placeholder="기안 내용을 입력해주세요"
                className="min-h-48 flex-1"
                aria-invalid={!!errors.content}
                {...register('content')}
              />
              {errors.content && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
            <Card className="flex h-full min-h-0 flex-col rounded-xl">
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <EmployeeSelectField
                  label="결재선"
                  description="결재 순서대로 처리됩니다."
                  ordered
                  roleOptions={APPROVAL_ROLE_OPTIONS}
                  rolesByEmpId={approverRoles}
                  onRoleChange={handleApproverRoleChange}
                  emptyText="결재선에 지정된 결재자가 없습니다."
                  selected={approverSelection}
                  onChange={handleApproverSelectionChange}
                />
              </CardContent>
            </Card>
            <Card className="flex h-full min-h-0 flex-col rounded-xl">
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                <EmployeeSelectField
                  label="공람 (선택)"
                  description="문서를 공람할 사원을 지정합니다."
                  emptyText="지정된 공람자가 없습니다."
                  selected={circulationSelection}
                  onChange={setCirculationSelection}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <DraftFormActions
          isSubmitting={isSubmitting}
          onCancel={() => navigate(`/approval/drafts/${draftId}`)}
          onPreview={handlePreview}
          onSaveDraft={() => void handleSave()}
          saveLabel="저장"
          submitLabel="상신"
        />
      </form>
    </DraftCreateFrame>
  )
}

export function LeaveDraftEditPage() {
  const { draftId: draftIdParam } = useParams()

  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined

  const detailQuery = useDraftDetailQuery(draftId)
  const meQuery = useMeQuery()

  if (draftId === undefined) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
      </GuardShell>
    )
  }

  if (detailQuery.isLoading || meQuery.isLoading) {
    return (
      <GuardShell>
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </GuardShell>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    const message = isNotFound(apiError)
      ? '기안서를 찾을 수 없습니다.'
      : isForbidden(apiError)
        ? '이 기안서를 수정할 권한이 없습니다.'
        : '기안서를 불러오지 못했습니다.'
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </GuardShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  if (!isLeaveDraft(draft) || draft.leave == null) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안은 휴가 기안이 아니어서 여기에서 수정할 수 없습니다.
        </p>
      </GuardShell>
    )
  }

  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(draft, myEmpId).canEdit) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.
        </p>
      </GuardShell>
    )
  }

  return <LeaveDraftEditForm draftId={draftId} draft={draft} leave={draft.leave} />
}
