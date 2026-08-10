import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { addCirculation } from '../api/addCirculation'
import type { LeaveDraftPayload } from '../api/createLeaveDraft'
import { useDraftFileUploadMutation } from '../api/useDraftFileUploadMutation'
import { useDraftSubmitMutation } from '../api/useDraftSubmitMutation'
import { useLeaveDraftCreateMutation } from '../api/useLeaveDraftCreateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { composeLeaveAt, LeaveDateHourField } from '../components/LeaveDateHourField'
import { useMyLeaveSummaryQuery } from '@/features/leave/api/useMyLeaveSummaryQuery'
import {
  calculateUsedLeaveDays,
  formatLeaveDays,
  isFourHourUnitLeaveType,
  LEAVE_END_HOUR_OPTIONS,
  LEAVE_START_HOUR_OPTIONS,
} from '../lib/leaveHours'
import {
  APPROVAL_ROLE_OPTIONS,
  toApprovalRole,
  type ApprovalRole,
  type ApproverParam,
} from '../model/approverParam'
import {
  DRAFT_PRINT_PREVIEW_STORAGE_KEY,
  type DraftPreviewField,
  type DraftPrintPreviewPayload,
} from '../model/draftPreview'
import { leaveDraftSchema, leaveTypeOptions, type LeaveDraftFormValues } from '../model/leaveDraftSchema'

function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

export function LeaveDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useLeaveDraftCreateMutation()
  const uploadFilesMutation = useDraftFileUploadMutation()
  const submitMutation = useDraftSubmitMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>({})
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [isContentManuallyEdited, setIsContentManuallyEdited] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startHour, setStartHour] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endHour, setEndHour] = useState('')

  const form = useZodForm(leaveDraftSchema, {
    defaultValues: { title: '', content: '', leaveType: undefined, startAt: '', endAt: '' },
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

  const todayDate = useMemo(() => dayjs().format('YYYY-MM-DD'), [])
  const startAtValue = watch('startAt')
  const endAtValue = watch('endAt')
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
    const nextStartAt = composeLeaveAt(date, hour)
    setValue('startAt', nextStartAt, { shouldValidate: isSubmitted })
    if (nextStartAt) {
      const endAt = getValues('endAt')
      if (endAt && endAt < nextStartAt) {
        if (isFourHourUnit) {
          setEndDate('')
          setEndHour('')
          setValue('endAt', '', { shouldValidate: isSubmitted })
        } else {
          setEndDate(date)
          setEndHour(hour)
          setValue('endAt', nextStartAt, { shouldValidate: isSubmitted })
        }
      }
    }
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

  useEffect(() => {
    if (isContentManuallyEdited) {
      return
    }
    const generated = [
      '[연가 신청]',
      `휴가 유형: ${leaveTypeOptions.find((option) => option.value === leaveTypeValue)?.label ?? '-'}`,
      `휴가 기간: ${toDisplayDateTime(startAtValue) || '-'} ~ ${toDisplayDateTime(endAtValue) || '-'}`,
      ...(isFourHourUnit
        ? [`사용 일수: ${usedLeaveDays !== null ? formatLeaveDays(usedLeaveDays) : '-'}`]
        : []),
      '업무 인수인계 후 휴가를 신청합니다.',
    ].join('\n')
    if (getValues('content') !== generated) {
      setValue('content', generated)
    }
  }, [
    isContentManuallyEdited,
    leaveTypeValue,
    startAtValue,
    endAtValue,
    isFourHourUnit,
    usedLeaveDays,
    getValues,
    setValue,
  ])

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

    const payload: LeaveDraftPayload = {
      param: { title: values.title, content: values.content, approvers },
      startAt: toRequestDateTime(values.startAt),
      endAt: toRequestDateTime(values.endAt),
      leaveType: values.leaveType,
    }

    const hasAttachments = attachments.length > 0
    const result = await mutation.mutateAsync({ payload, submit: submit && !hasAttachments })
    if (circulationSelection.length > 0) {
      try {
        await addCirculation(
          result.id,
          circulationSelection.map((emp) => emp.empId),
        )
      } catch {
        toast.error('공람자 지정에 실패했습니다. 상세 화면에서 다시 추가해주세요')
      }
    }

    if (hasAttachments) {
      try {
        await uploadFilesMutation.mutateAsync({ draftId: result.id, files: attachments })
        if (submit) {
          await submitMutation.mutateAsync({ draftId: result.id })
        }
      } catch {
        toast.error(
          submit
            ? '휴가 기안서가 임시저장되었습니다. 상세 화면에서 첨부와 상신을 이어서 진행해주세요'
            : '휴가 기안서는 임시저장되었으나 첨부파일 업로드에 실패했습니다. 상세 화면에서 다시 첨부해주세요',
        )
        navigate(`/approval/drafts/${result.id}`)
        return
      }
    }

    toast.success(submit ? '휴가 기안서를 상신했습니다' : '휴가 기안서를 임시저장했습니다')
    navigate(`/approval/drafts/${result.id}`)
  }

  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

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
      attachments: attachments.map((file) => file.name),
    }
    localStorage.setItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY, JSON.stringify(payload))
    window.open('/approval/drafts/preview', '_blank', 'noopener,noreferrer')
  }

  return (
    <DraftCreateFrame
      currentType="leave"
      attachments={attachments}
      onAttachmentsChange={setAttachments}
    >
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-4">
        <div className="grid min-h-0 flex-1 grid-rows-[4fr_1fr] gap-4">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leave-draft-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="leave-draft-title"
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
                <Label htmlFor="leave-draft-leave-type">
                  휴가 유형 <span className="text-destructive">*</span>
                </Label>
                <select
                  id="leave-draft-leave-type"
                  aria-invalid={!!errors.leaveType}
                  defaultValue=""
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  {...register('leaveType')}
                >
                  <option value="" disabled>
                    휴가 유형을 선택해주세요
                  </option>
                  {leaveTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isFourHourUnit && (
                  <p className="text-xs text-muted-foreground">
                    연차·특별휴가·대체휴무는 0.5일(4시간) 단위로만 사용할 수 있습니다. 사용
                    일수는 시작·종료 일시로 자동 계산되어 본문에 표시됩니다.
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
                id="leave-draft-start-at"
                label="휴가 시작 일시"
                hourAriaLabel="휴가 시작 시간"
                dateValue={startDate}
                hourValue={startHour}
                minDate={todayDate}
                error={errors.startAt?.message}
                hourOptions={isFourHourUnit ? LEAVE_START_HOUR_OPTIONS : undefined}
                onChange={handleStartChange}
              />

              <LeaveDateHourField
                id="leave-draft-end-at"
                label="휴가 종료 일시"
                hourAriaLabel="휴가 종료 시간"
                dateValue={endDate}
                hourValue={endHour}
                minDate={startDate || todayDate}
                error={errors.endAt?.message}
                hourOptions={isFourHourUnit ? LEAVE_END_HOUR_OPTIONS : undefined}
                onChange={handleEndChange}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="leave-draft-content">
                기안 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="leave-draft-content"
                placeholder="기안 내용을 입력해주세요"
                className="min-h-48 flex-1"
                aria-invalid={!!errors.content}
                {...register('content', {
                  onChange: () => setIsContentManuallyEdited(true),
                })}
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
          onCancel={() => navigate('/approval/box')}
          onPreview={handlePreview}
          onSaveDraft={() => void handleCreate()}
        />
      </form>
    </DraftCreateFrame>
  )
}
