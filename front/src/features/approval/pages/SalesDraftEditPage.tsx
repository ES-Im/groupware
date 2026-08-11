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
import { FranchisePicker, type FranchisePickerSelection } from '@/shared/components/FranchisePicker'
import { addCirculation } from '../api/addCirculation'
import { removeCirculation } from '../api/removeCirculation'
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { useDraftSubmitMutation } from '../api/useDraftSubmitMutation'
import { useSalesDraftUpdateMutation } from '../api/useSalesDraftUpdateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftEditAttachments } from '../components/DraftEditAttachments'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { getApprovalStatusBadge } from '../lib/approvalStatusBadge'
import { formatSalesAmount } from '../lib/formatSalesAmount'
import { isSalesDraft } from '../lib/isSalesDraft'
import { resolveDrafterActions } from '../lib/resolveDrafterActions'
import {
  APPROVAL_ROLE_OPTIONS,
  toApprovalRole,
  type ApprovalRole,
  type ApproverParam,
} from '../model/approverParam'
import type { DraftDetailResponse, SalesSlot } from '../model/draftDetail'
import {
  DRAFT_PRINT_PREVIEW_STORAGE_KEY,
  type DraftPreviewField,
  type DraftPrintPreviewPayload,
} from '../model/draftPreview'
import { salesDraftSchema, type SalesDraftFormValues } from '../model/salesDraftSchema'

function GuardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">{children}</div>
}

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
  const updateMutation = useSalesDraftUpdateMutation()
  const submitMutation = useDraftSubmitMutation()

  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>(() =>
    Object.fromEntries(
      draft.approvers.map((approver) => [approver.empId, toApprovalRole(approver.role)]),
    ),
  )
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>(() =>
    draft.circulations.map((circulation) => ({
      empId: circulation.empId,
      empName: circulation.empName,
    })),
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
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

  function handleFranchiseChange(next: FranchisePickerSelection | null) {
    setFranchiseSelection(next)
    setValue('franchiseId', next?.id ?? 0, { shouldValidate: true })
  }

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

  async function onValid(values: SalesDraftFormValues, submit: boolean) {
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

    await updateMutation.mutateAsync({
      draftId,
      payload: {
        param: { title: values.title, content: values.content, approvers },
        franchiseId: values.franchiseId,
        reportMonth: values.reportMonth,
        salesAmount: values.salesAmount,
      },
    })
    await reconcileCirculation()
    if (submit) {
      await submitMutation.mutateAsync({ draftId })
    }
    toast.success(submit ? '매출 기안서를 상신했습니다' : '매출 기안서를 수정했습니다')
    navigate(`/approval/drafts/${draftId}`)
  }

  const handleSave = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleSaveAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  function handlePreview() {
    const values = getValues()
    const previewFields: DraftPreviewField[] = [
      { label: '대상 가맹점', value: franchiseSelection?.name ?? '' },
      { label: '매출 보고월', value: values.reportMonth },
      { label: '매출액', value: formatSalesAmount(values.salesAmount) },
    ]
    const payload: DraftPrintPreviewPayload = {
      typeLabel: '매출보고서',
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
      currentType="sales"
      title="매출 기안서 수정"
      subtitle="임시저장된 기안서를 수정하거나 바로 상신합니다"
      formIcon={SquarePen}
      formTitle="매출 기안서"
      formDescription="제목·내용·매출 정보·결재선을 수정합니다"
      headerBadge="임시저장 수정"
      sidebar={
        <>
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
              </dl>
            </CardContent>
          </Card>
          <DraftEditAttachments draftId={draftId} files={draft.files} />
        </>
      }
    >
      <form noValidate onSubmit={handleSaveAndSubmit} className="flex flex-1 flex-col gap-6">
        <div className="grid min-h-0 flex-1 grid-rows-[4fr_1fr] gap-6">
          <div className="flex min-h-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sales-draft-edit-title" className="text-sm font-semibold">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sales-draft-edit-title"
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold">
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="sales-draft-edit-report-month" className="text-sm font-semibold">
                  매출 보고월 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sales-draft-edit-report-month"
                  type="month"
                  aria-invalid={!!errors.reportMonth}
                  className="h-11 rounded-xl"
                  {...register('reportMonth')}
                />
                {errors.reportMonth && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.reportMonth.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sales-draft-edit-sales-amount" className="text-sm font-semibold">
                  매출액(원) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sales-draft-edit-sales-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="매출액을 입력해주세요"
                  aria-invalid={!!errors.salesAmount}
                  className="h-11 rounded-xl"
                  {...register('salesAmount', { valueAsNumber: true })}
                />
                {errors.salesAmount && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.salesAmount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <Label htmlFor="sales-draft-edit-content" className="text-sm font-semibold">
                기안 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sales-draft-edit-content"
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
          draftId={draftId}
          saveLabel="저장"
          submitLabel="상신"
        />
      </form>
    </DraftCreateFrame>
  )
}

export function SalesDraftEditPage() {
  const { draftId: draftIdParam } = useParams()

  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined

  const detailQuery = useDraftDetailQuery(draftId)
  const meQuery = useMeQuery()

  if (draftId === undefined) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
      </GuardShell>
    )
  }

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
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </GuardShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  if (!isSalesDraft(draft) || draft.sales == null) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안은 매출 기안이 아니어서 여기에서 수정할 수 없습니다.
        </p>
      </GuardShell>
    )
  }

  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(draft, myEmpId).canEdit) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">매출 기안서 수정</h1>
        <p className="text-sm text-muted-foreground">
          이 기안을 수정할 권한이 없거나 이미 상신되어 수정할 수 없습니다.
        </p>
      </GuardShell>
    )
  }

  return <SalesDraftEditForm draftId={draftId} draft={draft} sales={draft.sales} />
}
