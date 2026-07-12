import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { addCirculation } from '../api/addCirculation'
import type { LeaveDraftPayload } from '../api/createLeaveDraft'
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

/**
 * datetime-local 입력값(`yyyy-MM-ddTHH:mm`, 분 단위)을 서버가 기대하는
 * `yyyy-MM-dd'T'HH:mm:ss`(초 보정)로 변환한다(ROADMAP(LEAVE) T1.3 §날짜 정밀도, ③선례 동형).
 */
function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

/** 미리보기·자동 입력용 일시 표기(`yyyy-MM-dd HH:mm`). 빈 값은 그대로 빈 문자열로 둔다. */
function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

/**
 * 휴가 기안 작성 페이지(F740 `LEAVE_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(LEAVE) T1.3,
 * docs/prd/11.leave-draft-prd.md §휴가 기안 작성 페이지).
 *
 * ③`BusinessTripDraftCreatePage`(F730)의 폼 로직(제목·본문 RHF+zod + EmployeePicker 결재선 + 2버튼 +
 * approverSelection→ApproverParam[] 매핑 + 성공 후 상세 이동)을 동형 이식하되, 출장 전용 필드
 * (목적지·목적·참여자 picker)를 제거하고 휴가 유형 Select 하나로 치환한다. 레이아웃은 공통
 * `DraftCreateFrame`을 따른다. 첨부는 화면 보관·미리보기 표시까지만(실제 업로드는 생성 후 상세 —
 * ②③선례, DraftCreateFrame 첨부 카드 주석 참조).
 *
 * 레퍼런스 이식 규칙 + 백엔드 연가 규칙(LeaveDraftService 실측) 반영:
 *   - 일시 min 제어: 시작일은 오늘부터, 종료일은 시작일 이후부터만 선택 가능. 시작을 종료보다
 *     뒤로 옮기면 종료를 정리한다(병가·공가는 시작으로 끌어올림, 4시간 단위 유형은 비움).
 *   - 1시간 단위·근무시간 내(DRAFT_002/008): 일시는 날짜 달력 + 시 select 분리 입력
 *     (`LeaveDateHourField`)으로 받아 분 선택 UI 자체를 없앤다. 조합은 항상 `HH:00`이며
 *     leaveDraftSchema의 정시(:00) refine이 안전망으로 남는다. zod 필드(startAt/endAt)는
 *     register 없이 setValue로만 동기화한다.
 *   - 4시간 단위 유형(DRAFT_005, 연차·특별휴가·대체휴무 — lib/leaveHours.ts): 시각 옵션을 반차
 *     경계(시작 09/13, 종료 13/18)로 제한해 어떤 조합도 0.5일 배수가 되게 하고, 시작·종료로
 *     사용 일수를 계산해 본문·안내문에 표시한다. 유형별 잔여 휴가(MY_EMP_LEAVE_SUMMARY —
 *     leave 도메인 훅 재사용)도 함께 보여준다. 다른 유형(병가·공가)은 09~18 전체를 자유 선택한다.
 *   - 기안 내용 자동 입력: 사용자가 본문을 직접 수정하기 전까지 유형 필드 값으로 본문을 자동
 *     구성한다(본문 입력 시 자동 갱신 중단).
 *
 * 휴가 유형 Select는 shadcn Select 미도입 상태라 근태 `DeptAttendancePage`가 확립한 네이티브
 * `<select>`(shadcn Input 톤 클래스) 컨벤션을 그대로 따른다(신규 컴포넌트 발명 아님).
 *
 * 결재선은 EmployeePicker 로컬 선택 상태(zod 스키마 밖)다: 선택 순서 → order(1-base), role은
 * 행별 select(결재/협조 — approverRoles state, 기본 APPROVER) → ApproverParam[](param.approvers).
 * 두 버튼:
 *   - [임시저장으로 생성](type=button): 결재선 없이 허용(LEAVE_DRAFT_CREATE, UNSUBMITTED).
 *   - [생성 후 상신](type=submit): 결재선 최소 1명 + APPROVER 역할 최소 1명 클라 사전검증(Open
 *     Q#1, 도메인모델 "결재자 최소 1명 이상 등록") 후 LEAVE_DRAFT_CREATE_SUBMISSION.
 * 두 진입 모두 동일 zod 사전검증(submitWithErrorMapping)을 거치며, 상신은 그 위에 결재선 가드를
 * 더한다(최종 판정은 서버). 생성 성공(201 {draftId}) 시 approvalKeys.all invalidate(mutation)
 * 후 토스트를 띄우고 새 기안 상세로 이동한다.
 *
 * 공람(선택): 생성 요청 body에는 공람 필드가 없으므로(request-fields 실측) 화면에서 지정한
 * 공람자는 생성 성공 후 `addCirculation`(F707) 후속 호출로 등록한다. 실패해도 기안은 이미
 * 생성됐으므로 이동을 막지 않고 상세 화면에서의 재추가를 토스트로 안내한다.
 */
export function LeaveDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useLeaveDraftCreateMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  // 결재선 행별 역할(empId → 결재/협조). 미지정 empId는 기본 APPROVER로 매핑한다.
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>({})
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [isContentManuallyEdited, setIsContentManuallyEdited] = useState(false)
  // 일시 분리 입력 상태(날짜 yyyy-MM-dd + 시 HH). zod 필드(startAt/endAt)는 이 조합의 파생값.
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

  // 오늘(date input 포맷). 과거 날짜를 피커 수준에서 막는다(레퍼런스 todayDateTimeMin 이식).
  const todayDate = useMemo(() => dayjs().format('YYYY-MM-DD'), [])
  const startAtValue = watch('startAt')
  const endAtValue = watch('endAt')
  const leaveTypeValue = watch('leaveType')
  // 4시간 단위 유형(연차·특별휴가·대체휴무)이면 시각 옵션을 반차 경계(시작 09/13, 종료
  // 13/18)로 제한하고 사용 일수를 계산해 보여준다(2026-07-11 폼 개편 — 종료 직접 선택).
  const isFourHourUnit = isFourHourUnitLeaveType(leaveTypeValue)

  // 유형별 잔여 휴가(MY_EMP_LEAVE_SUMMARY — leave 도메인 훅 재사용). 잔여 = 부여 − 사용은
  // 서버가 내려주지 않아 프론트 계산(leave 도메인 확정 결정). 연도는 백엔드 검증과 동일하게
  // 시작일 기준(미선택이면 서버 기본 = 현재 연도). EmpLeave 미보유 사원은 200 + 빈 바디라
  // 문자열/undefined 방어가 필요하다.
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

  // 선택한 시작·종료로 계산한 사용 일수(0.5 단위 — 백엔드 calculateUsedHours 순방향 미러).
  // 미완성/역전 입력이면 null. 본문 자동 구성과 폼 안내(잔여와 나란히)가 소비한다.
  const usedLeaveDays = isFourHourUnit
    ? calculateUsedLeaveDays(startDate, startHour, endDate, endHour)
    : null

  // 시작 일시 변경: 조합값을 zod 필드에 동기화하고, 시작이 종료보다 뒤로 이동하면 종료를
  // 정리한다(레퍼런스 updateStartAt 이식 — 동일 포맷 문자열은 사전순 비교가 시간순 비교와 일치).
  // 병가·공가는 종료를 시작으로 끌어올리고, 4시간 단위 유형은 시작 시각이 종료 옵션(13/18)에
  // 없을 수 있어 끌어올리는 대신 비운다(사용자가 다시 선택).
  // 재검증은 제출 이후에만(shouldValidate: isSubmitted — 기본 mode=onSubmit과 정합).
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

  // 유형이 4시간 단위 유형으로 바뀌면 반차 경계 밖 시각(병가에서 고른 10시 등)을 비운다 —
  // select 옵션이 좁아져 표시가 어긋나는 것을 막는다(옵션 안 값은 그대로 유지).
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

  // 기안 내용 자동 입력(레퍼런스 이식): 본문을 직접 수정하기 전까지 유형 필드 값으로 본문을
  // 구성한다. 4시간 단위 유형은 사용 일수(0.5 단위) 줄을 추가한다(사용자 요청 2026-07-11).
  // 생성 문자열이 현재 값과 같으면 setValue를 건너뛰어 불필요한 갱신 루프를 막는다.
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

  async function onValid(values: LeaveDraftFormValues, submit: boolean) {
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

    const payload: LeaveDraftPayload = {
      param: { title: values.title, content: values.content, approvers },
      startAt: toRequestDateTime(values.startAt),
      endAt: toRequestDateTime(values.endAt),
      leaveType: values.leaveType,
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
    toast.success(submit ? '휴가 기안서를 상신했습니다' : '휴가 기안서를 임시저장했습니다')
    navigate(`/approval/drafts/${result.draftId}`)
  }

  // [임시저장으로 생성]·[생성 후 상신] 두 진입 모두 동일 zod 사전검증을 거치도록 각각을
  // submitWithErrorMapping으로 감싼다(제출 실패는 handleApiError가 root 에러/토스트로 위임).
  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  // 미리보기 새 창(DRAFT_PRINT_PREVIEW_STORAGE_KEY 핸드오프, model/draftPreview.ts)에 넘길 폼
  // 스냅샷: 클릭 시점의 getValues()를 그대로 담는다. 제목·내용은 기안문 표 전용 필드로 분리하고
  // fields에는 유형별 부가 정보만 싣는다(undefined 가능 지점은 ''로 강제 — JSON 직렬화 계약).
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
      {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-4">
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

        {/* 유형 필드를 본문보다 앞에 둔다(레퍼런스 필드 순서: 제목 → 유형 필드 → 기안 내용).
            유형이 4시간 단위 모드(반차 경계 시각 제한·사용 일수 계산)를 결정하므로 첫 칸에 둔다. */}
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
            {/* 4시간 단위 유형(DRAFT_005 미러) 안내 + 유형별 잔여 휴가 — 유형을 고르는 순간
                규칙과 잔여를 함께 보여준다(사용자 요청 2026-07-11). */}
            {isFourHourUnit && (
              <p className="text-xs text-muted-foreground">
                연차·특별휴가·대체휴무는 0.5일(4시간) 단위로만 사용할 수 있습니다. 사용 일수는
                시작·종료 일시로 자동 계산되어 본문에 표시됩니다.
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

        {/* 시작·종료 일시는 항상 같은 행에 배치한다(sm 이상 2열 — 사용자 요청 2026-07-11).
            4시간 단위 유형은 시각 옵션을 반차 경계(시작 09/13, 종료 13/18)로 제한하고, 병가·
            공가는 근무시간(09~18시) 전체를 1시간 단위로 허용한다. */}
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-draft-content">
            기안 내용 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="leave-draft-content"
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
