import { useEffect, useState } from 'react'
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
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { useLeaveDraftUpdateMutation } from '../api/useLeaveDraftUpdateMutation'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { composeLeaveAt, LeaveDateHourField } from '../components/LeaveDateHourField'
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
import { toApprovalRole, type ApproverParam } from '../model/approverParam'
import type { DraftDetailResponse, LeaveSlot } from '../model/draftDetail'
import { leaveDraftSchema, leaveTypeOptions, type LeaveDraftFormValues } from '../model/leaveDraftSchema'

/** 안내 문구만 표시하는 공통 셸(로딩/에러/권한 분기 공유, BusinessTripDraftEditPage 동형). */
function EditPageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-3">{children}</div>
}

/**
 * datetime-local 입력값(`yyyy-MM-ddTHH:mm`, 분 단위)을 서버가 기대하는
 * `yyyy-MM-dd'T'HH:mm:ss`(초 보정)로 변환한다(BusinessTripDraftEditPage와 동형).
 */
function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

/** 서버 datetime(`yyyy-MM-dd'T'HH:mm:ss`)을 datetime-local 입력 초기값(`yyyy-MM-ddTHH:mm`)으로 변환한다. */
function toDateTimeLocalValue(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm')
}

/**
 * 편집 폼 자체(제목/본문 + 휴가 필드 + 결재선 + 저장). 부모(LeaveDraftEditPage)가 프리필 데이터
 * (draft/leave)와 진입 가드(isLeaveDraft × canEdit)를 모두 통과시킨 뒤에만 이 컴포넌트를 마운트한다 —
 * BusinessTripDraftEditForm과 동일하게 RHF가 마운트 시점의 defaultValues를 그대로 신뢰하도록 해,
 * 데이터 도착 후 수동 reset()을 두지 않는다. 결재선(EmployeePicker)도 마운트 시점에 draft.approvers를
 * order순 정렬해 초기 선택으로 복원한다(제어형 로컬 상태). 첨부는 이 폼 범위 밖(①상세).
 */
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
  const mutation = useLeaveDraftUpdateMutation()

  // approvers[]를 order 오름차순으로 정렬해 EmployeePicker 초기 선택(선택 순서=결재 순서)으로 복원한다.
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )

  // 기존 결재선의 역할(결재/협조)을 empId→role로 보존한다. 이 화면에는 역할 변경 UI가 없으므로
  // 저장 시 기존 역할을 그대로 되돌리고 새로 추가된 사원만 기본 APPROVER로 매핑한다(role을
  // APPROVER로 고정하면 협조자가 포함된 기안을 저장할 때 전원 결재로 덮여 결재선이 훼손된다).
  const existingRolesByEmpId = new Map(
    draft.approvers.map((approver) => [approver.empId, toApprovalRole(approver.role)]),
  )

  // 일시 분리 입력 상태(작성 폼과 동일 — 분 선택 UI 없이 날짜+시로 받는다). 기존 값
  // (yyyy-MM-ddTHH:mm:ss)을 날짜/시로 쪼개 프리필한다. 반차 경계(09/13·13/18) 밖의 옛 시각은
  // LeaveDateHourField가 보존 옵션으로 표시한다.
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
    setValue,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = form

  const leaveTypeValue = watch('leaveType')
  // 4시간 단위 유형(연차·특별휴가·대체휴무)이면 시각 옵션을 반차 경계(시작 09/13, 종료 13/18)로
  // 제한하고 사용 일수를 계산해 보여준다(작성 폼 동형 — 2026-07-11 폼 개편, 종료 직접 선택).
  const isFourHourUnit = isFourHourUnitLeaveType(leaveTypeValue)

  // 유형별 잔여 휴가(MY_EMP_LEAVE_SUMMARY — 작성 폼 동형). 연도는 백엔드 검증과 동일하게
  // 시작일 기준. EmpLeave 미보유 사원은 200 + 빈 바디라 문자열/undefined 방어.
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

  // 선택한 시작·종료로 계산한 사용 일수(0.5 단위 — 작성 폼 동형).
  const usedLeaveDays = isFourHourUnit
    ? calculateUsedLeaveDays(startDate, startHour, endDate, endHour)
    : null

  // 분리 입력 → zod 필드(startAt/endAt) 동기화. 재검증은 저장 시도 이후에만(shouldValidate:
  // isSubmitted — 기본 mode=onSubmit과 정합). 작성 폼과 달리 min/클램프는 기존 동작대로 두지 않는다
  // (이 폼은 원래 min 제어가 없었다 — 기간 정합성 최종 판정은 서버).
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

  // 유형이 4시간 단위 유형으로 바뀌면 반차 경계 밖 시각을 비운다(작성 폼 동형). 프리필 시각이
  // 경계 밖인 기존 기안도 이 정리를 거친다 — 저장하려면 새 경계로 다시 고르게 하는 의도.
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

  async function submit(values: LeaveDraftFormValues) {
    // 결재선은 EmployeePicker 로컬 상태다. 화면 선택을 그대로 전량 갱신으로 보낸다(부분 전송도
    // 계약상 허용). 선택이 비면 approvers를 생략한다(BusinessTripDraftEditForm 동일 — 빈 배열로
    // 기존 결재선을 지우는 파괴적 동작은 MVP 범위 밖). 최종 판정은 서버가 한다.
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
        leaveType: values.leaveType,
      },
    })
    toast.success('휴가 기안서를 수정했습니다')
    navigate(`/approval/drafts/${draftId}`)
  }

  const submitEdit = submitWithErrorMapping(form, submit)

  return (
    <EditPageShell>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            휴가 기안서
          </CardTitle>
          <CardDescription>제목·본문·휴가 유형·기간·결재선을 수정한 뒤 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leave-draft-edit-content">
                본문 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="leave-draft-edit-content"
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leave-draft-edit-type">
                휴가 유형 <span className="text-destructive">*</span>
              </Label>
              {/* shadcn Select 대신 LeaveDraftCreatePage와 동일한 네이티브 select 컨벤션을 따른다
                  (근태 DeptAttendancePage 선례, shadcn Input 톤 클래스 — 신규 컴포넌트 발명 아님). */}
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
              {/* 4시간 단위 유형(DRAFT_005 미러) 안내 + 유형별 잔여 휴가(작성 폼 동형). */}
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

            {/* 시작·종료 일시는 항상 같은 행에 배치한다(sm 이상 2열 — 사용자 요청 2026-07-11).
                4시간 단위 유형은 시각 옵션을 반차 경계(시작 09/13, 종료 13/18)로 제한하고,
                병가·공가는 근무시간(09~18시) 전체를 1시간 단위로 허용한다(작성 폼 동형). */}
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

            <div className="flex flex-col gap-1.5">
              <Label>결재선</Label>
              <EmployeePicker selected={approverSelection} onChange={setApproverSelection} />
            </div>

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

/**
 * 휴가 기안 수정 페이지(F741 `LEAVE_DRAFT_UPDATE`, ROADMAP(LEAVE) T2.4,
 * docs/prd/11.leave-draft-prd.md §휴가 기안 수정 페이지).
 *
 * 상세 [수정](DrafterActions, M6에서 isLeaveDraft 분기 배선) 또는 직접 URL로 진입한다.
 * `useDraftDetailQuery`(F701, ①)로 기존 값을 프리필하며, 진입 가드는 세 조건을 모두 요구한다
 * (최종 판정은 서버):
 *   - decimal 양의 정수 draftId 라우트 가드(BusinessTripDraftEditPage 동일 정규식).
 *   - isLeaveDraft(슬롯-null 술어, T2.1) — 휴가 기안이 아니면 이 화면에서 수정 불가.
 *   - resolveDrafterActions(①).canEdit — 기안자 본인 + UNSUBMITTED.
 * 가드를 통과하면 LeaveDraftEditForm이 프리필된 값으로 마운트되고, 저장(204) 성공 시 상세로
 * 복귀한다. BusinessTripDraftEditPage 컨벤션을 복제한다(참여자 없음 — 유형 select로 교체,
 * LeaveDraftCreatePage와 동일한 네이티브 select 컨벤션).
 */
export function LeaveDraftEditPage() {
  const { draftId: draftIdParam } = useParams()

  // route param은 신뢰 불가 입력이다(DraftDetailPage/BusinessTripDraftEditPage 동일 가드): 순수 10진
  // 양의 정수만 허용해 지수/16진수/음수 표기가 다른 기안서로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined

  const detailQuery = useDraftDetailQuery(draftId)
  const meQuery = useMeQuery()

  if (draftId === undefined) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
      </EditPageShell>
    )
  }

  // me 로딩 전에는 기안자 판정이 불가하므로(canEdit이 false로 나와 오탐) 상세·me가 모두 준비될
  // 때까지 로딩으로 둔다.
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
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </EditPageShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  // 휴가 기안이 아니면(슬롯-null) 이 화면에서 수정하지 않는다(각 유형 PRD 관할). isLeaveDraft가
  // 도메인 판별을 담당하고, draft.leave 직접 null 체크를 병기해 TS가 이후 leave를 non-null로
  // 좁히도록 한다(isLeaveDraft 자체는 boolean만 반환하는 순수 함수라 타입 가드가 아님).
  if (!isLeaveDraft(draft) || draft.leave == null) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안은 휴가 기안이 아니어서 여기에서 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  // 기안자 본인 + UNSUBMITTED만 수정 가능(①의 canEdit 소비). 최종 판정은 서버가 한다.
  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(draft, myEmpId).canEdit) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">휴가 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  return <LeaveDraftEditForm draftId={draftId} draft={draft} leave={draft.leave} />
}
