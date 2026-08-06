import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { addCirculation } from '../api/addCirculation'
import type { BusinessTripDraftPayload } from '../api/createBusinessTripDraft'
import { useBusinessTripDraftCreateMutation } from '../api/useBusinessTripDraftCreateMutation'
import { composeDateTime, DateTimeField } from '../components/DateTimeField'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import {
  APPROVAL_ROLE_OPTIONS,
  toApprovalRole,
  type ApprovalRole,
  type ApproverParam,
} from '../model/approverParam'
import {
  businessTripDraftSchema,
  type BusinessTripDraftFormValues,
} from '../model/businessTripDraftSchema'
import {
  DRAFT_PRINT_PREVIEW_STORAGE_KEY,
  type DraftPreviewField,
  type DraftPrintPreviewPayload,
} from '../model/draftPreview'

function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

export function BusinessTripDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useBusinessTripDraftCreateMutation()
  const meQuery = useMeQuery()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>({})
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>([])
  const [participantSelection, setParticipantSelection] = useState<EmployeePickerEmployee[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [isContentManuallyEdited, setIsContentManuallyEdited] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isParticipantSeeded, setIsParticipantSeeded] = useState(false)

  useEffect(() => {
    if (isParticipantSeeded || !meQuery.data) {
      return
    }
    const me = meQuery.data.empBasicInfo
    setParticipantSelection((prev) =>
      prev.some((emp) => emp.empId === me.empId)
        ? prev
        : [{ empId: me.empId, empName: me.name }, ...prev],
    )
    setIsParticipantSeeded(true)
  }, [isParticipantSeeded, meQuery.data])

  const form = useZodForm(businessTripDraftSchema, {
    defaultValues: { title: '', content: '', destination: '', purpose: '', startAt: '', endAt: '' },
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
  const destinationValue = watch('destination')
  const purposeValue = watch('purpose')

  function handleStartChange(date: string, time: string) {
    setStartDate(date)
    setStartTime(time)
    const nextStartAt = composeDateTime(date, time)
    setValue('startAt', nextStartAt, { shouldValidate: isSubmitted })
    if (nextStartAt) {
      const endAt = getValues('endAt')
      if (endAt && endAt < nextStartAt) {
        setEndDate(date)
        setEndTime(time)
        setValue('endAt', nextStartAt, { shouldValidate: isSubmitted })
      }
    }
  }

  function handleEndChange(date: string, time: string) {
    setEndDate(date)
    setEndTime(time)
    setValue('endAt', composeDateTime(date, time), { shouldValidate: isSubmitted })
  }

  useEffect(() => {
    if (isContentManuallyEdited) {
      return
    }
    const participantNames = participantSelection.map((emp) => emp.empName).join(', ')
    const generated = [
      '[출장 신청]',
      `출장 기간: ${toDisplayDateTime(startAtValue) || '-'} ~ ${toDisplayDateTime(endAtValue) || '-'}`,
      `출장지: ${destinationValue || '-'}`,
      `출장 목적: ${purposeValue || '-'}`,
      `참여자: ${participantNames || '-'}`,
    ].join('\n')
    if (getValues('content') !== generated) {
      setValue('content', generated)
    }
  }, [
    isContentManuallyEdited,
    startAtValue,
    endAtValue,
    destinationValue,
    purposeValue,
    participantSelection,
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

  async function onValid(values: BusinessTripDraftFormValues, submit: boolean) {
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

    const participantIds: number[] | undefined =
      participantSelection.length > 0 ? participantSelection.map((emp) => emp.empId) : undefined

    const payload: BusinessTripDraftPayload = {
      param: { title: values.title, content: values.content, approvers },
      startAt: toRequestDateTime(values.startAt),
      endAt: toRequestDateTime(values.endAt),
      destination: values.destination,
      purpose: values.purpose,
      participantIds,
    }

    const result = await mutation.mutateAsync({ payload, submit })
    if (circulationSelection.length > 0) {
      try {
        await addCirculation(
          result.draftId,
          circulationSelection.map((emp) => emp.empId),
        )
      } catch {
        toast.error('공람자 지정에 실패했습니다. 상세 화면에서 다시 추가해주세요')
      }
    }
    toast.success(submit ? '출장 기안서를 상신했습니다' : '출장 기안서를 임시저장했습니다')
    navigate(`/approval/drafts/${result.draftId}`)
  }

  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  function handlePreview() {
    const values = getValues()
    const previewFields: DraftPreviewField[] = [
      {
        label: '출장 기간',
        value: `${toDisplayDateTime(values.startAt) || '-'} ~ ${toDisplayDateTime(values.endAt) || '-'}`,
      },
      { label: '출장지', value: values.destination },
      { label: '출장 목적', value: values.purpose },
      { label: '참여자', value: participantSelection.map((emp) => emp.empName).join(', ') },
    ]
    const payload: DraftPrintPreviewPayload = {
      typeLabel: '출장신청서',
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
      currentType="business-trip"
      attachments={attachments}
      onAttachmentsChange={setAttachments}
    >
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-4">
        <div className="grid min-h-0 flex-1 grid-rows-[4fr_1fr] gap-4">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-trip-draft-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="business-trip-draft-title"
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
              <DateTimeField
                id="business-trip-draft-start-at"
                label="출장 시작 일시"
                timeAriaLabel="출장 시작 시각"
                dateValue={startDate}
                timeValue={startTime}
                minDate={todayDate}
                error={errors.startAt?.message}
                onChange={handleStartChange}
              />

              <DateTimeField
                id="business-trip-draft-end-at"
                label="출장 종료 일시"
                timeAriaLabel="출장 종료 시각"
                dateValue={endDate}
                timeValue={endTime}
                minDate={startDate || todayDate}
                error={errors.endAt?.message}
                onChange={handleEndChange}
              />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="business-trip-draft-destination">
                  출장지 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business-trip-draft-destination"
                  placeholder="출장지를 입력해주세요"
                  aria-invalid={!!errors.destination}
                  {...register('destination')}
                />
                {errors.destination && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.destination.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="business-trip-draft-purpose">
                  출장 목적 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business-trip-draft-purpose"
                  placeholder="출장 목적을 입력해주세요"
                  aria-invalid={!!errors.purpose}
                  {...register('purpose')}
                />
                {errors.purpose && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.purpose.message}
                  </p>
                )}
              </div>
            </div>

            <EmployeeSelectField
              label="참여자 (선택)"
              description="출장에 함께하는 사원을 선택합니다."
              emptyText="선택된 참여자가 없습니다."
              selected={participantSelection}
              onChange={setParticipantSelection}
            />

            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="business-trip-draft-content">
                기안 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="business-trip-draft-content"
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
