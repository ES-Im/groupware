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

/** 로딩/에러/권한 안내만 표시하는 공통 셸(진입 가드 공유). */
function GuardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">{children}</div>
}

/**
 * datetime-local 입력값(`yyyy-MM-ddTHH:mm`, 분 단위)을 서버가 기대하는
 * `yyyy-MM-dd'T'HH:mm:ss`(초 보정)로 변환한다.
 */
function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

/** 서버 datetime(`yyyy-MM-dd'T'HH:mm:ss`)을 datetime-local 입력 초기값(`yyyy-MM-ddTHH:mm`)으로 변환한다. */
function toDateTimeLocalValue(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm')
}

/** 미리보기용 일시 표기(`yyyy-MM-dd HH:mm`). 빈 값은 그대로 빈 문자열로 둔다. */
function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

/**
 * 임시저장(휴가) 기안 수정 폼. 부모(LeaveDraftEditPage)가 프리필 데이터(draft/leave)와 진입 가드
 * (isLeaveDraft × canEdit)를 모두 통과시킨 뒤에만 마운트한다 — RHF가 마운트 시점 defaultValues를
 * 그대로 신뢰하도록 데이터 도착 후 수동 reset()을 두지 않는다.
 *
 * "새 기안서 형식을 그대로 차용"(사용자 요청 2026-07-14 — 일반기안/취소기안 수정과 동일 형식):
 * LeaveDraftCreatePage와 동일한 DraftCreateFrame 레이아웃(제목·유형·기간·본문 + 결재선/공람)을
 * 쓰되, 종류 선택이 무의미하므로 좌측을 문서 정보 카드로 대체하고 버튼을 수정 문맥([저장]/[상신])으로
 * 바꾼다. 제목·본문·유형·기간·결재선·공람은 기존 값으로 프리필하고, 본문 자동 생성은 하지 않는다
 * (사용자가 저장했던 본문을 유형/기간 변경으로 덮어쓰지 않기 위함 — 작성 화면과의 유일한 차이).
 * 공람은 이미 존재하는 기안이라 저장 시 초기값과 비교해 add/remove로 리컨실한다(F707/F708).
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
  const updateMutation = useLeaveDraftUpdateMutation()
  const submitMutation = useDraftSubmitMutation()

  // approvers[]를 order 오름차순으로 정렬해 결재선 초기 선택(선택 순서=결재 순서)으로 복원한다.
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )
  // 기존 결재선 역할(결재/협조)을 empId→role로 프리필한다. 새로 추가된 사원은 select 기본값(APPROVER).
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>(() =>
    Object.fromEntries(
      draft.approvers.map((approver) => [approver.empId, toApprovalRole(approver.role)]),
    ),
  )
  // 공람자 초기 선택(리컨실 기준).
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>(() =>
    draft.circulations.map((circulation) => ({
      empId: circulation.empId,
      empName: circulation.empName,
    })),
  )

  // 일시 분리 입력 상태(작성 폼과 동일 — 분 선택 UI 없이 날짜+시로 받는다). 기존 값을 날짜/시로
  // 쪼개 프리필한다. 반차 경계 밖의 옛 시각은 LeaveDateHourField가 보존 옵션으로 표시한다.
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
  // 4시간 단위 유형(연차·특별휴가·대체휴무)이면 시각 옵션을 반차 경계(시작 09/13, 종료 13/18)로
  // 제한하고 사용 일수를 계산해 보여준다(작성 폼 동형).
  const isFourHourUnit = isFourHourUnitLeaveType(leaveTypeValue)

  // 유형별 잔여 휴가(MY_EMP_LEAVE_SUMMARY — 작성 폼 동형). 연도는 시작일 기준. EmpLeave 미보유
  // 사원은 200 + 빈 바디라 문자열/undefined 방어.
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
  // isSubmitted — 기본 mode=onSubmit과 정합). 기존 수정 폼과 동일하게 min/클램프는 두지 않는다
  // (과거 시각의 임시저장 기안도 그대로 편집 가능 — 기간 정합성 최종 판정은 서버).
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

  // 공람 리컨실(F707/F708): 초기 선택 대비 추가분은 배치 add, 제외분은 개별 remove. 기안은 이미
  // 저장됐으므로 실패해도 이동을 막지 않고 상세에서의 재시도를 토스트로 안내한다.
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
    // [상신]만 결재선을 클라 사전검증한다(작성 페이지와 동일 규칙): 최소 1명 + 결재(APPROVER)
    // 역할 최소 1명. 위반 시 root 에러로 안내하고 요청을 보내지 않는다(최종 판정은 서버).
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

    // 결재선은 화면 선택 전량을 갱신으로 보낸다(부분 전송도 계약상 허용). 선택이 비면 approvers를
    // 생략한다(빈 배열로 기존 결재선을 지우는 파괴적 동작은 범위 밖).
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
    // [상신]은 저장 직후 상신까지 이어간다(방금 갱신한 결재선으로 상신 — approvers 미전달).
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
      {/* form onSubmit은 기본 액션([상신])으로 둔다. [저장]은 type=button으로 분리. */}
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

            {/* 유형 필드를 본문보다 앞에 둔다(작성 폼 동형). 유형이 4시간 단위 모드를 결정한다. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leave-draft-edit-type">
                  휴가 유형 <span className="text-destructive">*</span>
                </Label>
                {/* shadcn Select 대신 LeaveDraftCreatePage와 동일한 네이티브 select 컨벤션을 따른다. */}
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

            {/* 시작·종료 일시는 항상 같은 행에 배치한다(sm 이상 2열). 4시간 단위 유형은 시각 옵션을
                반차 경계(시작 09/13, 종료 13/18)로 제한하고, 병가·공가는 근무시간(09~18시) 전체를
                1시간 단위로 허용한다(작성 폼 동형). */}
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

            {/* 남는 높이는 기안 내용 Textarea가 흡수한다(flex-1 min-h-0 — min-h-48은 바닥값으로 유지). */}
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

          {/* 결재선(좌) / 공람(우) 각각 별도 카드로 감싼다(작성 폼 동형). */}
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

/**
 * 휴가 기안 수정 페이지(F741 `LEAVE_DRAFT_UPDATE`, ROADMAP(LEAVE) T2.4,
 * docs/prd/11.leave-draft-prd.md §휴가 기안 수정 페이지).
 *
 * 상세 [수정](DrafterActions, M6에서 isLeaveDraft 분기 배선) 또는 직접 URL로 진입한다.
 * `useDraftDetailQuery`(F701, ①)로 기존 값을 프리필하며, 진입 가드는 세 조건을 모두 요구한다
 * (최종 판정은 서버):
 *   - decimal 양의 정수 draftId 라우트 가드.
 *   - isLeaveDraft(슬롯-null 술어, T2.1) — 휴가 기안이 아니면 이 화면에서 수정 불가.
 *   - resolveDrafterActions(①).canEdit — 기안자 본인 + UNSUBMITTED.
 * 가드를 통과하면 LeaveDraftEditForm이 프리필된 값으로 마운트되고, 저장(204)/상신 성공 시 상세로
 * 복귀한다. 폼은 LeaveDraftCreatePage와 동일한 DraftCreateFrame 형식을 차용한다.
 */
export function LeaveDraftEditPage() {
  const { draftId: draftIdParam } = useParams()

  // route param은 신뢰 불가 입력이다(DraftDetailPage 동일 가드): 순수 10진 양의 정수만 허용해
  // 지수/16진수/음수 표기가 다른 기안서로 오매핑되는 것을 막는다.
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

  // me 로딩 전에는 기안자 판정이 불가하므로(canEdit이 false로 나와 오탐) 상세·me가 모두 준비될
  // 때까지 로딩으로 둔다.
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

  // 휴가 기안이 아니면(슬롯-null) 이 화면에서 수정하지 않는다(각 유형 PRD 관할). isLeaveDraft가
  // 도메인 판별을 담당하고, draft.leave 직접 null 체크를 병기해 TS가 이후 leave를 non-null로 좁히도록 한다.
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

  // 기안자 본인 + UNSUBMITTED만 수정 가능(①의 canEdit 소비). 최종 판정은 서버가 한다.
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
