import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import dayjs from 'dayjs'
import { Save, SquarePen } from 'lucide-react'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { useBusinessTripDraftUpdateMutation } from '../api/useBusinessTripDraftUpdateMutation'
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { composeDateTime, DateTimeField } from '../components/DateTimeField'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { isBusinessTripDraft } from '../lib/isBusinessTripDraft'
import { resolveDrafterActions } from '../lib/resolveDrafterActions'
import { toApprovalRole, type ApproverParam } from '../model/approverParam'
import {
  businessTripDraftSchema,
  type BusinessTripDraftFormValues,
} from '../model/businessTripDraftSchema'
import type { BusinessTripSlot, DraftDetailResponse } from '../model/draftDetail'

function EditPageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-3">{children}</div>
}

function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

function toDateTimeLocalValue(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm')
}

function BusinessTripDraftEditForm({
  draftId,
  draft,
  businessTrip,
}: {
  draftId: number
  draft: DraftDetailResponse
  businessTrip: BusinessTripSlot
}) {
  const navigate = useNavigate()
  const mutation = useBusinessTripDraftUpdateMutation()

  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )

  const existingRolesByEmpId = new Map(
    draft.approvers.map((approver) => [approver.empId, toApprovalRole(approver.role)]),
  )

  const [startDate, setStartDate] = useState(() => dayjs(businessTrip.startAt).format('YYYY-MM-DD'))
  const [startTime, setStartTime] = useState(() => dayjs(businessTrip.startAt).format('HH:mm'))
  const [endDate, setEndDate] = useState(() => dayjs(businessTrip.endAt).format('YYYY-MM-DD'))
  const [endTime, setEndTime] = useState(() => dayjs(businessTrip.endAt).format('HH:mm'))

  const form = useZodForm(businessTripDraftSchema, {
    defaultValues: {
      title: draft.title,
      content: draft.content,
      destination: businessTrip.destination,
      purpose: businessTrip.purpose,
      startAt: toDateTimeLocalValue(businessTrip.startAt),
      endAt: toDateTimeLocalValue(businessTrip.endAt),
    },
  })
  const {
    register,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = form

  function handleStartChange(date: string, time: string) {
    setStartDate(date)
    setStartTime(time)
    setValue('startAt', composeDateTime(date, time), { shouldValidate: isSubmitted })
  }

  function handleEndChange(date: string, time: string) {
    setEndDate(date)
    setEndTime(time)
    setValue('endAt', composeDateTime(date, time), { shouldValidate: isSubmitted })
  }

  async function submit(values: BusinessTripDraftFormValues) {
    const approvers: ApproverParam[] | undefined =
      approverSelection.length > 0
        ? approverSelection.map((emp, index) => ({
            approverId: emp.empId,
            role: existingRolesByEmpId.get(emp.empId) ?? 'APPROVER',
            order: index + 1,
          }))
        : undefined

    await mutation.mutateAsync({
      draftId,
      payload: {
        param: { title: values.title, content: values.content, approvers },
        startAt: toRequestDateTime(values.startAt),
        endAt: toRequestDateTime(values.endAt),
        destination: values.destination,
        purpose: values.purpose,
      },
    })
    toast.success('출장 기안서를 수정했습니다')
    navigate(`/approval/drafts/${draftId}`)
  }

  const submitEdit = submitWithErrorMapping(form, submit)

  return (
    <EditPageShell>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">출장 기안서 수정</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            출장 기안서
          </CardTitle>
          <CardDescription>제목·본문·출장 기간·목적지·목적·결재선을 수정한 뒤 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-trip-draft-edit-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="business-trip-draft-edit-title"
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-trip-draft-edit-content">
                본문 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="business-trip-draft-edit-content"
                placeholder="본문을 입력해주세요"
                className="min-h-48"
                aria-invalid={!!errors.content}
                {...register('content')}
              />
              {errors.content && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DateTimeField
                id="business-trip-draft-edit-start-at"
                label="출장 시작 일시"
                timeAriaLabel="출장 시작 시각"
                dateValue={startDate}
                timeValue={startTime}
                error={errors.startAt?.message}
                onChange={handleStartChange}
              />

              <DateTimeField
                id="business-trip-draft-edit-end-at"
                label="출장 종료 일시"
                timeAriaLabel="출장 종료 시각"
                dateValue={endDate}
                timeValue={endTime}
                error={errors.endAt?.message}
                onChange={handleEndChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-trip-draft-edit-destination">
                출장지 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="business-trip-draft-edit-destination"
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
              <Label htmlFor="business-trip-draft-edit-purpose">
                출장 목적 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="business-trip-draft-edit-purpose"
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

            <div className="flex flex-col gap-1.5">
              <Label>결재선</Label>
              <EmployeePicker selected={approverSelection} onChange={setApproverSelection} />
            </div>

            <p className="text-sm text-muted-foreground">
              참여자는 이 화면에서 수정할 수 없습니다. 기안서 상세 페이지의 참여자 수정에서 변경해주세요.
            </p>

            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => navigate(`/approval/drafts/${draftId}`)}
              >
                취소
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => void submitEdit()}>
                <Save />
                저장
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </EditPageShell>
  )
}

export function BusinessTripDraftEditPage() {
  const { draftId: draftIdParam } = useParams()

  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined

  const detailQuery = useDraftDetailQuery(draftId)
  const meQuery = useMeQuery()

  if (draftId === undefined) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">출장 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
      </EditPageShell>
    )
  }

  if (detailQuery.isLoading || meQuery.isLoading) {
    return (
      <EditPageShell>
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </EditPageShell>
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
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">출장 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </EditPageShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  if (!isBusinessTripDraft(draft) || draft.businessTrip == null) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">출장 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안은 출장 기안이 아니어서 여기에서 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(draft, myEmpId).canEdit) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">출장 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  return <BusinessTripDraftEditForm draftId={draftId} draft={draft} businessTrip={draft.businessTrip} />
}
