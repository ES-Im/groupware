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

function EditPageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-3">{children}</div>
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
  const mutation = useSalesDraftUpdateMutation()

  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>(() =>
    [...draft.approvers]
      .sort((a, b) => a.order - b.order)
      .map((approver) => ({ empId: approver.empId, empName: approver.empName })),
  )

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

export function SalesDraftEditPage() {
  const { draftId: draftIdParam } = useParams()

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
