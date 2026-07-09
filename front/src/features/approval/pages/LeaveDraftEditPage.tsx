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
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { useLeaveDraftUpdateMutation } from '../api/useLeaveDraftUpdateMutation'
import { EmployeePicker, type EmployeePickerEmployee } from '../components/EmployeePicker'
import { isLeaveDraft } from '../lib/isLeaveDraft'
import { resolveDrafterActions } from '../lib/resolveDrafterActions'
import type { ApproverParam } from '../model/approverParam'
import type { DraftDetailResponse, LeaveSlot } from '../model/draftDetail'
import { leaveDraftSchema, leaveTypeOptions, type LeaveDraftFormValues } from '../model/leaveDraftSchema'

/** 안내 문구만 표시하는 공통 셸(로딩/에러/권한 분기 공유, BusinessTripDraftEditPage 동형). */
function EditPageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">{children}</div>
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
    formState: { errors, isSubmitting },
  } = form

  async function submit(values: LeaveDraftFormValues) {
    // 결재선은 EmployeePicker 로컬 상태다. 화면 선택을 그대로 전량 갱신으로 보낸다(부분 전송도
    // 계약상 허용). 선택이 비면 approvers를 생략한다(BusinessTripDraftEditForm 동일 — 빈 배열로
    // 기존 결재선을 지우는 파괴적 동작은 MVP 범위 밖). 최종 판정은 서버가 한다.
    const approvers: ApproverParam[] | undefined =
      approverSelection.length > 0
        ? approverSelection.map((emp, index) => ({
            approverId: emp.empId,
            role: 'APPROVER',
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
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register('leaveType')}
              >
                {leaveTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.leaveType && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.leaveType.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leave-draft-edit-start-at">
                  휴가 시작 일시 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="leave-draft-edit-start-at"
                  type="datetime-local"
                  aria-invalid={!!errors.startAt}
                  {...register('startAt')}
                />
                {errors.startAt && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.startAt.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leave-draft-edit-end-at">
                  휴가 종료 일시 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="leave-draft-edit-end-at"
                  type="datetime-local"
                  aria-invalid={!!errors.endAt}
                  {...register('endAt')}
                />
                {errors.endAt && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.endAt.message}
                  </p>
                )}
              </div>
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
