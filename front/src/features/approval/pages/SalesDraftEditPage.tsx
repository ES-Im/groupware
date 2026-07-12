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
import { useSalesDraftUpdateMutation } from '../api/useSalesDraftUpdateMutation'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { FranchisePicker, type FranchisePickerSelection } from '@/shared/components/FranchisePicker'
import { isSalesDraft } from '../lib/isSalesDraft'
import { resolveDrafterActions } from '../lib/resolveDrafterActions'
import { toApprovalRole, type ApproverParam } from '../model/approverParam'
import type { DraftDetailResponse, SalesSlot } from '../model/draftDetail'
import { salesDraftSchema, type SalesDraftFormValues } from '../model/salesDraftSchema'

/** 안내 문구만 표시하는 공통 셸(로딩/에러/권한 분기 공유, BusinessTripDraftEditPage 동형). */
function EditPageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-3">{children}</div>
}

/**
 * 편집 폼 자체(제목/본문 + 매출 필드 + 결재선 + 저장). 부모(SalesDraftEditPage)가 프리필 데이터
 * (draft/sales)와 진입 가드(isSalesDraft × canEdit)를 모두 통과시킨 뒤에만 이 컴포넌트를 마운트한다 —
 * BusinessTripDraftEditForm과 동일하게 RHF가 마운트 시점의 defaultValues를 그대로 신뢰하도록 해,
 * 데이터 도착 후 수동 reset()을 두지 않는다. 결재선(EmployeePicker)·대상 가맹점(FranchisePicker)도
 * 마운트 시점에 draft.approvers(order순 정렬)·sales.{franchiseId,franchiseName}로 초기 선택을
 * 복원한다(둘 다 제어형 로컬 상태). `franchiseId`는 네이티브 입력이 아니므로 FranchisePicker의
 * onChange에서 setValue로 RHF 값과 동기화한다(salesDraftSchema 주석의 설계 그대로). 첨부는 이 폼
 * 범위 밖(①상세).
 */
function SalesDraftEditForm({
  draftId,
  draft,
  sales,
}: {
  draftId: number
  draft: DraftDetailResponse
  sales: SalesSlot
}) {
  const navigate = useNavigate()
  const mutation = useSalesDraftUpdateMutation()

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

  const [franchiseSelection, setFranchiseSelection] = useState<FranchisePickerSelection | null>({
    id: sales.franchiseId,
    name: sales.franchiseName,
  })

  const form = useZodForm(salesDraftSchema, {
    defaultValues: {
      title: draft.title,
      content: draft.content,
      franchiseId: sales.franchiseId,
      reportMonth: sales.reportMonth,
      salesAmount: sales.salesAmount,
    },
  })
  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = form

  function handleFranchiseChange(next: FranchisePickerSelection | null) {
    setFranchiseSelection(next)
    setValue('franchiseId', next?.id ?? 0, { shouldValidate: true })
  }

  async function submit(values: SalesDraftFormValues) {
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
        franchiseId: values.franchiseId,
        reportMonth: values.reportMonth,
        salesAmount: values.salesAmount,
      },
    })
    toast.success('매출 기안서를 수정했습니다')
    navigate(`/approval/drafts/${draftId}`)
  }

  const submitEdit = submitWithErrorMapping(form, submit)

  return (
    <EditPageShell>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            매출 기안서
          </CardTitle>
          <CardDescription>
            제목·본문·대상 가맹점·매출 보고월·매출액·결재선을 수정한 뒤 저장합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sales-draft-edit-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sales-draft-edit-title"
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
              <Label htmlFor="sales-draft-edit-content">
                본문 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sales-draft-edit-content"
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
              <Label>
                대상 가맹점 <span className="text-destructive">*</span>
              </Label>
              <FranchisePicker selected={franchiseSelection} onChange={handleFranchiseChange} />
              {errors.franchiseId && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.franchiseId.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sales-draft-edit-report-month">
                  매출 보고월 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sales-draft-edit-report-month"
                  type="month"
                  aria-invalid={!!errors.reportMonth}
                  {...register('reportMonth')}
                />
                {errors.reportMonth && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.reportMonth.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sales-draft-edit-sales-amount">
                  매출액(원) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sales-draft-edit-sales-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="예: 1000000"
                  aria-invalid={!!errors.salesAmount}
                  {...register('salesAmount', { valueAsNumber: true })}
                />
                {errors.salesAmount && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.salesAmount.message}
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
 * 매출 기안 수정 페이지(F761 `SALES_DRAFT_UPDATE`, ROADMAP(SALES) T3.4,
 * docs/prd/12.sales-draft-prd.md §매출 기안 수정 페이지).
 *
 * 상세 [수정](DrafterActions, M4에서 isSalesDraft 분기 배선) 또는 직접 URL로 진입한다.
 * `useDraftDetailQuery`(F701, ①)로 기존 값을 프리필하며, 진입 가드는 세 조건을 모두 요구한다
 * (최종 판정은 서버):
 *   - decimal 양의 정수 draftId 라우트 가드(BusinessTripDraftEditPage 동일 정규식).
 *   - isSalesDraft(슬롯-null 술어, T3.1) — 매출 기안이 아니면 이 화면에서 수정 불가.
 *   - resolveDrafterActions(①).canEdit — 기안자 본인 + UNSUBMITTED.
 * 가드를 통과하면 SalesDraftEditForm이 프리필된 값으로 마운트되고, 저장(204) 성공 시 상세로
 * 복귀한다. BusinessTripDraftEditPage 컨벤션을 복제한다(유형 필드→FranchisePicker·month·매출액).
 */
export function SalesDraftEditPage() {
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
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
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
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </EditPageShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  // 매출 기안이 아니면(슬롯-null) 이 화면에서 수정하지 않는다(각 유형 PRD 관할). isSalesDraft가
  // 도메인 판별을 담당하고, draft.sales 직접 null 체크를 병기해 TS가 이후 sales를 non-null로
  // 좁히도록 한다(isSalesDraft 자체는 boolean만 반환하는 순수 함수라 타입 가드가 아님).
  if (!isSalesDraft(draft) || draft.sales == null) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안은 매출 기안이 아니어서 여기에서 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  // 기안자 본인 + UNSUBMITTED만 수정 가능(①의 canEdit 소비). 최종 판정은 서버가 한다.
  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(draft, myEmpId).canEdit) {
    return (
      <EditPageShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.
        </p>
      </EditPageShell>
    )
  }

  return <SalesDraftEditForm draftId={draftId} draft={draft} sales={draft.sales} />
}
