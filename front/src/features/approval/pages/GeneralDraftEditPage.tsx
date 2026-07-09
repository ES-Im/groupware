import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
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
import { useGeneralDraftUpdateMutation } from '../api/useGeneralDraftUpdateMutation'
import { EmployeePicker, type EmployeePickerEmployee } from '../components/EmployeePicker'
import { isGeneralDraft } from '../lib/isGeneralDraft'
import { resolveDrafterActions } from '../lib/resolveDrafterActions'
import type { ApproverParam } from '../model/approverParam'
import type { DraftDetailResponse } from '../model/draftDetail'
import { generalDraftSchema, type GeneralDraftFormValues } from '../model/generalDraftSchema'

/** 안내 문구만 표시하는 공통 셸(로딩/에러/권한 분기 공유). */
function EditPageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">{children}</div>
}

/**
 * 편집 폼 자체(제목/본문 + 결재선 + 저장). 부모(GeneralDraftEditPage)가 프리필 데이터(draft)와
 * 진입 가드(isGeneralDraft × canEdit)를 모두 통과시킨 뒤에만 이 컴포넌트를 마운트한다 —
 * BoardEditForm과 동일하게 RHF가 마운트 시점의 defaultValues를 그대로 신뢰하도록 해, 데이터 도착
 * 후 수동 reset()을 두지 않는다. 결재선(EmployeePicker)도 마운트 시점에 draft.approvers를 order순
 * 정렬해 초기 선택으로 복원한다(제어형 로컬 상태).
 */
function GeneralDraftEditForm({ draftId, draft }: { draftId: number; draft: DraftDetailResponse }) {
  const navigate = useNavigate()
  const mutation = useGeneralDraftUpdateMutation()

  // approvers[]를 order 오름차순으로 정렬해 EmployeePicker 초기 선택(선택 순서=결재 순서)으로 복원한다.
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )

  const form = useZodForm(generalDraftSchema, {
    defaultValues: { title: draft.title, content: draft.content },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  async function submit(values: GeneralDraftFormValues) {
    // 결재선은 EmployeePicker 로컬 상태다. 화면 선택을 그대로 전량 갱신으로 보낸다(부분 전송도
    // 계약상 허용). 선택이 비면 approvers를 생략한다(취소기안/작성 선례 동일 — 빈 배열로 기존
    // 결재선을 지우는 파괴적 동작은 MVP 범위 밖). 최종 판정은 서버가 한다.
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
      payload: { title: values.title, content: values.content, approvers },
    })
    toast.success('기안서를 수정했습니다')
    navigate(`/approval/drafts/${draftId}`)
  }

  const submitEdit = submitWithErrorMapping(form, submit)

  return (
    <EditPageShell>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">기안서 수정</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            일반 기안서
          </CardTitle>
          <CardDescription>제목·본문·결재선을 수정한 뒤 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="general-draft-edit-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="general-draft-edit-title"
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
              <Label htmlFor="general-draft-edit-content">
                본문 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="general-draft-edit-content"
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
 * 일반 기안 수정 페이지(F721 `GENERAL_DRAFT_UPDATE`, ROADMAP(DRAFT-COMMON) T2.3,
 * docs/prd/8.general-draft-prd.md §일반 기안 수정 페이지).
 *
 * 상세 [수정](DrafterActions, T2.4) 또는 직접 URL로 진입한다. `useDraftDetailQuery`(F701, ①)로
 * 기존 값을 프리필하며, 진입 가드는 세 조건을 모두 요구한다(최종 판정은 서버):
 *   - isGeneralDraft(슬롯-null 술어, T2.1) — 유형 슬롯 있는 기안은 이 화면에서 수정 불가.
 *   - resolveDrafterActions(①).canEdit — 기안자 본인 + UNSUBMITTED.
 * 가드를 통과하면 GeneralDraftEditForm이 프리필된 값으로 마운트되고, 저장(204) 성공 시 상세로 복귀한다.
 * decimal 가드·로딩/에러 분기는 BoardEditPage/DraftDetailPage 컨벤션을 복제한다(첨부 UI 없음).
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
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
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
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </EditPageShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  // 유형 슬롯 있는 기안(휴가/출장/매출/취소기안)은 이 화면에서 수정하지 않는다(각 유형 PRD 관할).
  if (!isGeneralDraft(draft)) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안은 일반 기안이 아니어서 여기에서 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  // 기안자 본인 + UNSUBMITTED만 수정 가능(①의 canEdit 소비). 최종 판정은 서버가 한다.
  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(draft, myEmpId).canEdit) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  return <GeneralDraftEditForm draftId={draftId} draft={draft} />
}
