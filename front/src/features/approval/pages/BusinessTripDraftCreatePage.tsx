import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
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

/**
 * datetime-local 입력값(`yyyy-MM-ddTHH:mm`, 분 단위)을 서버가 기대하는
 * `yyyy-MM-dd'T'HH:mm:ss`(초 보정)로 변환한다(ROADMAP(DRAFT-BUSINESSTRIP) T1.3 §날짜 정밀도).
 */
function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

/** 미리보기·자동 입력용 일시 표기(`yyyy-MM-dd HH:mm`). 빈 값은 그대로 빈 문자열로 둔다. */
function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

/**
 * 출장 기안 작성 페이지(F730 `BUSINESS_TRIP_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(DRAFT-BUSINESSTRIP) T1.3,
 * docs/prd/10.businesstrip-draft-prd.md §출장 기안 작성 페이지).
 *
 * ②`GeneralDraftCreatePage`(F720)의 폼 로직(제목·본문 RHF+zod + EmployeePicker 결재선 + 2버튼 +
 * approverSelection→ApproverParam[] 매핑 + 성공 후 상세 이동)을 동형 복제하되, 출장 전용 필드
 * (출장 기간·목적지·목적)와 두 번째 EmployeePicker(참여자)를 추가한다. 레이아웃은 공통
 * `DraftCreateFrame`을 따른다. 첨부는 화면 보관·미리보기 표시까지만(실제 업로드는 생성 후 상세 —
 * ②선례, DraftCreateFrame 첨부 카드 주석 참조).
 *
 * 레퍼런스 이식 규칙 2가지(원본 apps/draft/create):
 *   - 일시 min 제어: 시작은 오늘 00:00부터, 종료는 시작 이후부터만 피커에서 선택 가능. 시작을
 *     종료보다 뒤로 옮기면 종료를 시작으로 끌어올린다(updateStartAt 동형).
 *   - 기안 내용 자동 입력: 사용자가 본문을 직접 수정하기 전까지 출장 필드 값으로 본문을 자동
 *     구성한다(본문 입력 시 자동 갱신 중단).
 *
 * 결재선·참여자는 둘 다 EmployeePicker 로컬 선택 상태(zod 스키마 밖)다:
 *   - 결재선: 선택 순서 → order(1-base), role은 행별 select(결재/협조 — approverRoles state,
 *     기본 APPROVER) → ApproverParam[](param.approvers).
 *   - 참여자: 선택 순서 무관 → empId 목록(participantIds, 최상위 형제 필드). 폼 진입 시
 *     기안자(useMeQuery)를 디폴트로 1회 시드한다(제거 가능 — 재주입 없음).
 * 두 버튼:
 *   - [임시저장으로 생성](type=button): 결재선 없이 허용(BUSINESS_TRIP_DRAFT_CREATE, UNSUBMITTED).
 *   - [생성 후 상신](type=submit): 결재선 최소 1명 + APPROVER 역할 최소 1명 클라 사전검증(Open
 *     Q#1, 도메인모델 "결재자 최소 1명 이상 등록") 후 BUSINESS_TRIP_DRAFT_CREATE_SUBMISSION.
 * 두 진입 모두 동일 zod 사전검증(submitWithErrorMapping)을 거치며, 상신은 그 위에 결재선 가드를
 * 더한다(최종 판정은 서버). 생성 성공(201 {draftId}) 시 approvalKeys.all invalidate(mutation)
 * 후 토스트를 띄우고 새 기안 상세로 이동한다.
 *
 * 공람(선택): 생성 요청 body에는 공람 필드가 없으므로(request-fields 실측) 화면에서 지정한
 * 공람자는 생성 성공 후 `addCirculation`(F707) 후속 호출로 등록한다. 실패해도 기안은 이미
 * 생성됐으므로 이동을 막지 않고 상세 화면에서의 재추가를 토스트로 안내한다.
 */
export function BusinessTripDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useBusinessTripDraftCreateMutation()
  const meQuery = useMeQuery()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  // 결재선 행별 역할(empId → 결재/협조). 미지정 empId는 기본 APPROVER로 매핑한다.
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>({})
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>([])
  const [participantSelection, setParticipantSelection] = useState<EmployeePickerEmployee[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [isContentManuallyEdited, setIsContentManuallyEdited] = useState(false)
  // 일시 분리 입력 상태(날짜 yyyy-MM-dd + 시각 HH:mm — DateTimeField, 2026-07-11 datetime-local
  // 대체). zod 필드(startAt/endAt)는 이 조합의 파생값이다.
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  // 참여자 기안자 디폴트 시드를 1회만 수행하기 위한 플래그(사용자가 기안자를 제거하면 다시
  // 주입하지 않는다 — 디폴트일 뿐 강제 아님).
  const [isParticipantSeeded, setIsParticipantSeeded] = useState(false)

  // 폼 진입 시 참여자에 기안자(=나)를 디폴트로 채운다. me는 비동기라 도착 시점에 1회 시드하며,
  // 그 사이 사용자가 이미 추가한 선택은 유지하고 기안자를 맨 앞에 붙인다(중복이면 그대로 둔다).
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

  // 오늘(달력 min). 과거 일시를 피커 수준에서 막는다(레퍼런스 todayDateTimeMin 이식).
  const todayDate = useMemo(() => dayjs().format('YYYY-MM-DD'), [])
  const startAtValue = watch('startAt')
  const endAtValue = watch('endAt')
  const destinationValue = watch('destination')
  const purposeValue = watch('purpose')

  // 시작 일시 변경: 조합값을 zod 필드에 동기화하고, 시작이 종료보다 뒤로 이동하면 종료를 시작으로
  // 끌어올린다(레퍼런스 updateStartAt 이식 — 동일 포맷 문자열은 사전순 비교가 시간순 비교와 일치).
  // 재검증은 제출 이후에만(shouldValidate: isSubmitted — 기본 mode=onSubmit과 정합).
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

  // 기안 내용 자동 입력(레퍼런스 이식): 본문을 직접 수정하기 전까지 출장 필드 값으로 본문을
  // 구성한다. 생성 문자열이 현재 값과 같으면 setValue를 건너뛰어 불필요한 갱신 루프를 막는다.
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

  // 결재선 선택 변경: 해제된 사원의 역할 항목을 함께 정리하고(재추가 시 기본 결재로 시작),
  // 선택이 생기면 결재선 미지정 root 에러를 즉시 해제해 상신 재시도를 막지 않는다.
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

  // 역할 변경(결재↔협조)도 상신 가드(APPROVER 최소 1명)의 재평가 대상이라 root 에러를 해제한다.
  function handleApproverRoleChange(empId: number, role: string) {
    setApproverRoles((prev) => ({ ...prev, [empId]: toApprovalRole(role) }))
    clearErrors('root')
  }

  async function onValid(values: BusinessTripDraftFormValues, submit: boolean) {
    // [생성 후 상신]만 결재선을 클라 사전검증한다(Open Q#1): 최소 1명 + 결재(APPROVER) 역할 최소
    // 1명(도메인모델 "결재자 최소 1명 이상 등록" — 전원 협조로는 결재 진행 불가). 결재선은
    // EmployeePicker 로컬 상태라 zod 밖에서 검사하며, 위반 시 root 에러로 안내하고 요청을 보내지 않는다.
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
    // 생성 요청 body에는 공람 필드가 없어(request-fields 실측) 공람자는 생성 성공 후 F707 후속
    // 호출로 등록한다. 기안은 이미 생성됐으므로 실패해도 이동을 막지 않고 재추가를 안내한다.
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

  // [임시저장으로 생성]·[생성 후 상신] 두 진입 모두 동일 zod 사전검증을 거치도록 각각을
  // submitWithErrorMapping으로 감싼다(제출 실패는 handleApiError가 root 에러/토스트로 위임).
  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  // 미리보기 새 창(DRAFT_PRINT_PREVIEW_STORAGE_KEY 핸드오프, model/draftPreview.ts)에 넘길 폼
  // 스냅샷: 클릭 시점의 getValues()를 그대로 담는다. 제목·내용은 기안문 표 전용 필드로 분리하고
  // fields에는 유형별 부가 정보만 싣는다.
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
      {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-4">
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

        {/* 유형 필드를 본문보다 앞에 둔다(레퍼런스 필드 순서: 제목 → 유형 필드 → 참여자 → 기안 내용). */}
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="business-trip-draft-content">
            기안 내용 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="business-trip-draft-content"
            placeholder="기안 내용을 입력해주세요"
            className="min-h-48"
            aria-invalid={!!errors.content}
            {...register('content', {
              // 직접 수정이 시작되면 자동 입력을 중단한다(setValue는 이 onChange를 타지 않는다).
              onChange: () => setIsContentManuallyEdited(true),
            })}
          />
          {errors.content && (
            <p role="alert" className="text-sm text-destructive">
              {errors.content.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t pt-4">
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
          {/* 공람자는 생성 요청에 실을 수 없어(계약) 생성 성공 후 addCirculation으로 등록한다. */}
          <EmployeeSelectField
            label="공람 (선택)"
            description="문서를 공람할 사원을 지정합니다."
            emptyText="지정된 공람자가 없습니다."
            selected={circulationSelection}
            onChange={setCirculationSelection}
          />
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
