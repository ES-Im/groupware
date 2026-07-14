import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
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
import { useGeneralDraftUpdateMutation } from '../api/useGeneralDraftUpdateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { getApprovalStatusBadge } from '../lib/approvalStatusBadge'
import { isGeneralDraft } from '../lib/isGeneralDraft'
import { resolveDrafterActions } from '../lib/resolveDrafterActions'
import {
  APPROVAL_ROLE_OPTIONS,
  toApprovalRole,
  type ApprovalRole,
  type ApproverParam,
} from '../model/approverParam'
import type { DraftDetailResponse } from '../model/draftDetail'
import {
  DRAFT_PRINT_PREVIEW_STORAGE_KEY,
  type DraftPreviewField,
  type DraftPrintPreviewPayload,
} from '../model/draftPreview'
import { generalDraftSchema, type GeneralDraftFormValues } from '../model/generalDraftSchema'

/** 로딩/에러/권한 안내만 표시하는 공통 셸(진입 가드 공유). */
function GuardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">{children}</div>
}

/**
 * 임시저장(일반) 기안 수정 폼. 부모(GeneralDraftEditPage)가 프리필 데이터(draft)와 진입 가드
 * (isGeneralDraft × canEdit)를 모두 통과시킨 뒤에만 마운트한다 — RHF가 마운트 시점 defaultValues를
 * 그대로 신뢰하도록 데이터 도착 후 수동 reset()을 두지 않는다.
 *
 * "새 기안서 형식을 그대로 차용"(사용자 요청 2026-07-14): 작성 화면과 동일한 DraftCreateFrame
 * 레이아웃(좌측 문서 정보 카드 + 우측 큰 폼)을 쓰되, 종류 선택이 무의미하므로 좌측을 문서 정보
 * 카드로 대체하고 버튼 문구를 수정 문맥([저장]/[상신])으로 바꾼다. 제목·본문·결재선·공람은 기존
 * 값으로 프리필한다(자동 입력). 공람은 작성 화면과 달리 이미 존재하는 기안이라, 저장 시 초기값과
 * 비교해 추가분은 addCirculation·제외분은 removeCirculation으로 리컨실한다(F707/F708).
 */
function GeneralDraftEditForm({ draftId, draft }: { draftId: number; draft: DraftDetailResponse }) {
  const navigate = useNavigate()
  const updateMutation = useGeneralDraftUpdateMutation()
  const submitMutation = useDraftSubmitMutation()

  // approvers[]를 order 오름차순으로 정렬해 결재선 초기 선택(선택 순서=결재 순서)으로 복원한다.
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )
  // 기존 결재선의 역할(결재/협조)을 empId→role로 프리필한다. 새로 추가된 사원은 select 기본값
  // (APPROVER)으로 매핑된다.
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>(() =>
    Object.fromEntries(
      draft.approvers.map((approver) => [approver.empId, toApprovalRole(approver.role)]),
    ),
  )
  // 공람자 초기 선택(리컨실 기준). 저장 시 이 초기값과 현재 선택을 비교해 add/remove를 계산한다.
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>(() =>
    draft.circulations.map((circulation) => ({
      empId: circulation.empId,
      empName: circulation.empName,
    })),
  )

  const form = useZodForm(generalDraftSchema, {
    defaultValues: { title: draft.title, content: draft.content },
  })
  const {
    register,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

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

  async function onValid(values: GeneralDraftFormValues, submit: boolean) {
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
      payload: { title: values.title, content: values.content, approvers },
    })
    await reconcileCirculation()
    // [상신]은 저장 직후 상신까지 이어간다(방금 갱신한 결재선으로 상신 — approvers 미전달).
    if (submit) {
      await submitMutation.mutateAsync({ draftId })
    }
    toast.success(submit ? '기안서를 상신했습니다' : '기안서를 저장했습니다')
    navigate(`/approval/drafts/${draftId}`)
  }

  const handleSave = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleSaveAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  function handlePreview() {
    const values = getValues()
    const previewFields: DraftPreviewField[] = []
    const payload: DraftPrintPreviewPayload = {
      typeLabel: '일반기안서',
      title: values.title,
      content: values.content,
      fields: previewFields,
      approvers: approverSelection.map((emp) => ({
        empId: emp.empId,
        empName: emp.empName,
        role: approverRoles[emp.empId] ?? 'APPROVER',
      })),
      circulations: circulationSelection.map((emp) => ({ empId: emp.empId, empName: emp.empName })),
      // 수정 화면은 로컬 첨부 선택이 없어 이미 저장된 첨부 파일명을 표시한다.
      attachments: draft.files.map((file) => file.originalName),
    }
    localStorage.setItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY, JSON.stringify(payload))
    window.open('/approval/drafts/preview', '_blank', 'noopener,noreferrer')
  }

  const statusBadge = getApprovalStatusBadge(draft.approvalStatus)

  return (
    <DraftCreateFrame
      currentType="general"
      title="기안서 수정"
      subtitle="임시저장된 기안서를 수정하거나 바로 상신합니다"
      formIcon={SquarePen}
      formTitle="일반 기안서"
      formDescription="제목·내용·결재선을 수정합니다"
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
      <form noValidate onSubmit={handleSaveAndSubmit} className="flex flex-1 flex-col gap-6">
        <div className="grid min-h-0 flex-1 grid-rows-[4fr_1fr] gap-6">
          <div className="flex min-h-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="general-draft-edit-title" className="text-sm font-semibold">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="general-draft-edit-title"
                placeholder="제목을 입력해주세요"
                aria-invalid={!!errors.title}
                className="h-11 rounded-xl"
                {...register('title')}
              />
              {errors.title && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <Label htmlFor="general-draft-edit-content" className="text-sm font-semibold">
                기안 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="general-draft-edit-content"
                placeholder="기안 내용을 입력해주세요"
                className="min-h-48 flex-1 rounded-xl leading-7"
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

          <div className="grid min-h-0 grid-cols-1 gap-4 border-t pt-6 md:grid-cols-2">
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
 * 일반 기안 수정 페이지(F721 `GENERAL_DRAFT_UPDATE`, ROADMAP(DRAFT-COMMON) T2.3,
 * docs/prd/8.general-draft-prd.md §일반 기안 수정 페이지).
 *
 * 상세 [수정](DrafterActions, T2.4) 또는 직접 URL로 진입한다. `useDraftDetailQuery`(F701, ①)로
 * 기존 값을 프리필하며, 진입 가드는 세 조건을 모두 요구한다(최종 판정은 서버):
 *   - isGeneralDraft(슬롯-null 술어, T2.1) — 유형 슬롯 있는 기안은 이 화면에서 수정 불가.
 *   - resolveDrafterActions(①).canEdit — 기안자 본인 + UNSUBMITTED.
 * 가드를 통과하면 GeneralDraftEditForm이 프리필된 값으로 마운트되고, 저장(204)/상신 성공 시 상세로
 * 복귀한다. decimal 가드·로딩/에러 분기는 BoardEditPage/DraftDetailPage 컨벤션을 복제한다.
 */
export function GeneralDraftEditPage() {
  const { draftId: draftIdParam } = useParams()

  // route param은 신뢰 불가 입력이다(DraftDetailPage/BoardEditPage 동일 가드): 순수 10진 양의 정수만
  // 허용해 지수/16진수/음수 표기가 다른 기안서로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined

  const detailQuery = useDraftDetailQuery(draftId)
  const meQuery = useMeQuery()

  if (draftId === undefined) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
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
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </GuardShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  // 유형 슬롯 있는 기안(휴가/출장/매출/취소기안)은 이 화면에서 수정하지 않는다(각 유형 PRD 관할).
  if (!isGeneralDraft(draft)) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안은 일반 기안이 아니어서 여기에서 수정할 수 없습니다.
        </p>
      </GuardShell>
    )
  }

  // 기안자 본인 + UNSUBMITTED만 수정 가능(①의 canEdit 소비). 최종 판정은 서버가 한다.
  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(draft, myEmpId).canEdit) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.
        </p>
      </GuardShell>
    )
  }

  return <GeneralDraftEditForm draftId={draftId} draft={draft} />
}
