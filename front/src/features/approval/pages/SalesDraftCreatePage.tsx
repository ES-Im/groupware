import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { getFranchiseMonthlySales } from '@/features/franchise/api/getFranchiseMonthlySales'
import { franchiseKeys } from '@/features/franchise/model/queryKeys'
import { handleApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { addCirculation } from '../api/addCirculation'
import type { SalesDraftPayload } from '../api/createSalesDraft'
import { useSalesDraftCreateMutation } from '../api/useSalesDraftCreateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { FranchisePicker, type FranchisePickerSelection } from '@/shared/components/FranchisePicker'
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
import { salesDraftSchema, type SalesDraftFormValues } from '../model/salesDraftSchema'

function formatSalesAmount(value: number): string {
  return Number.isFinite(value) ? `${value.toLocaleString('ko-KR')}원` : ''
}

export function SalesDraftCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useSalesDraftCreateMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>({})
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>([])
  const [franchiseSelection, setFranchiseSelection] = useState<FranchisePickerSelection | null>(
    null,
  )
  const [attachments, setAttachments] = useState<File[]>([])
  const [isContentManuallyEdited, setIsContentManuallyEdited] = useState(false)
  const [isSalesAmountLoading, setIsSalesAmountLoading] = useState(false)

  const form = useZodForm(salesDraftSchema, {
    defaultValues: { title: '', content: '', franchiseId: 0, reportMonth: '' },
  })
  const {
    register,
    getValues,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

  const reportMonthValue = watch('reportMonth')
  const salesAmountValue = watch('salesAmount')

  function handleFranchiseChange(next: FranchisePickerSelection | null) {
    setFranchiseSelection(next)
    setValue('franchiseId', next?.id ?? 0, { shouldValidate: true })
  }

  useEffect(() => {
    if (isContentManuallyEdited) {
      return
    }
    const generated = [
      '[매출 보고]',
      `가맹점: ${franchiseSelection?.name ?? '-'}`,
      `보고 월: ${reportMonthValue || '-'}`,
      `매출액: ${formatSalesAmount(salesAmountValue) || '-'}`,
    ].join('\n')
    if (getValues('content') !== generated) {
      setValue('content', generated)
    }
  }, [
    isContentManuallyEdited,
    franchiseSelection,
    reportMonthValue,
    salesAmountValue,
    getValues,
    setValue,
  ])

  async function handleLoadSalesAmount() {
    const franchiseId = getValues('franchiseId')
    const reportMonth = getValues('reportMonth')
    if (!franchiseId) {
      toast.error('매출액을 불러오려면 대상 가맹점을 먼저 선택해주세요')
      return
    }
    if (!reportMonth) {
      toast.error('매출액을 불러오려면 매출 보고월을 먼저 선택해주세요')
      return
    }

    setIsSalesAmountLoading(true)
    try {
      const sales = await queryClient.fetchQuery({
        queryKey: franchiseKeys.monthlySales(franchiseId, reportMonth),
        queryFn: () => getFranchiseMonthlySales(franchiseId, reportMonth),
      })
      if (!sales || typeof sales === 'string') {
        toast.error(`${reportMonth}에는 매출 데이터가 없습니다`)
        return
      }
      setValue('salesAmount', sales.totalSalesAmount, { shouldValidate: true })
      toast.success(`${sales.franchiseName}의 ${reportMonth} 월 매출을 불러왔습니다`)
    } catch (error) {
      handleApiError(error, { toast })
    } finally {
      setIsSalesAmountLoading(false)
    }
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

    const payload: SalesDraftPayload = {
      param: { title: values.title, content: values.content, approvers },
      franchiseId: values.franchiseId,
      reportMonth: values.reportMonth,
      salesAmount: values.salesAmount,
    }

    const result = await mutation.mutateAsync({ payload, submit })
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
    toast.success(submit ? '매출 기안서를 상신했습니다' : '매출 기안서를 임시저장했습니다')
    navigate(`/approval/drafts/${result.draftId}`)
  }

  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

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
      attachments: attachments.map((file) => file.name),
    }
    localStorage.setItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY, JSON.stringify(payload))
    window.open('/approval/drafts/preview', '_blank', 'noopener,noreferrer')
  }

  return (
    <DraftCreateFrame
      currentType="sales"
      attachments={attachments}
      onAttachmentsChange={setAttachments}
    >
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-4">
        <div className="grid min-h-0 flex-1 grid-rows-[4fr_1fr] gap-4">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sales-draft-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sales-draft-title"
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
                <Label htmlFor="sales-draft-report-month">
                  매출 보고월 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sales-draft-report-month"
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
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="sales-draft-sales-amount">
                    매출액(원) <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-1 py-0 text-xs text-primary"
                    disabled={isSalesAmountLoading}
                    onClick={() => void handleLoadSalesAmount()}
                  >
                    <RefreshCw className={isSalesAmountLoading ? 'animate-spin' : undefined} />
                    {isSalesAmountLoading ? '불러오는 중...' : '매출액 불러오기'}
                  </Button>
                </div>
                <Input
                  id="sales-draft-sales-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="매출액을 입력해주세요"
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

            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="sales-draft-content">
                기안 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sales-draft-content"
                placeholder="기안 내용을 입력해주세요"
                className="min-h-48 flex-1"
                aria-invalid={!!errors.content}
                {...register('content', {
                  onChange: () => setIsContentManuallyEdited(true),
                })}
              />
              {errors.content && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>
          </div>

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
          onCancel={() => navigate('/approval/box')}
          onPreview={handlePreview}
          onSaveDraft={() => void handleCreate()}
        />
      </form>
    </DraftCreateFrame>
  )
}
