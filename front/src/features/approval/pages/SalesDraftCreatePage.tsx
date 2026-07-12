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

/** 매출액 표시(자동 입력·미리보기 공용): 유한 숫자만 `1,234원`으로, 그 외(NaN 등)는 빈 문자열. */
function formatSalesAmount(value: number): string {
  return Number.isFinite(value) ? `${value.toLocaleString('ko-KR')}원` : ''
}

/**
 * 매출 기안 작성 페이지(F760 `SALES_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(SALES) T2.3,
 * docs/prd/12.sales-draft-prd.md §매출 기안 작성 페이지).
 *
 * ③`BusinessTripDraftCreatePage`(F730)의 폼 로직(제목·본문 RHF+zod + EmployeePicker 결재선 +
 * 2버튼 + approverSelection→ApproverParam[] 매핑 + 성공 후 상세 이동)을 동형 복제하되, 출장 전용
 * 필드(기간·목적지·목적·참여자)를 매출 필드(FranchisePicker→franchiseId·매출 보고월 month input·
 * 매출액)로 치환한다. 레이아웃은 공통 `DraftCreateFrame`을 따른다. 첨부는 화면 보관·미리보기
 * 표시까지만(실제 업로드는 생성 후 상세 — ②③④선례, DraftCreateFrame 첨부 카드 주석 참조).
 *
 * 레퍼런스 이식 규칙 2가지(원본 apps/draft/create):
 *   - [매출액 불러오기]: 가맹점·보고월이 정해지면 `FRANCHISE_SALES_MONTHLY`
 *     (`GET /api/franchises/{franchiseId}/sales/months/{yyyy-MM}`)로 월 매출을 조회해 응답의
 *     totalSalesAmount를 매출액 필드에 주입한다(원본은 하드코딩 — 여기서는 실 API 연동).
 *     1회성 폼 주입이라 훅 대신 queryClient.fetchQuery로 호출한다(같은 달 재클릭은 캐시 히트).
 *   - 기안 내용 자동 입력: 사용자가 본문을 직접 수정하기 전까지 매출 필드 값으로 본문을 자동
 *     구성한다(본문 입력 시 자동 갱신 중단).
 *
 * franchiseId는 FranchisePicker(제어형, 네이티브 입력이 아님)의 선택 결과를 로컬 state로 들고
 * 있다가 `setValue`로 zod 필드에 동기화한다(reportMonth/salesAmount는 네이티브 input이라 register로
 * 직결). 결재선은 ②③④와 동일하게 EmployeePicker 로컬 선택 상태(zod 스키마 밖)이며, role은
 * 행별 select(결재/협조 — approverRoles state, 기본 APPROVER)로 지정한다.
 *
 * 두 버튼:
 *   - [임시저장으로 생성](type=button): 결재선 없이 허용(SALES_DRAFT_CREATE, UNSUBMITTED).
 *   - [생성 후 상신](type=submit): 결재선 최소 1명 + APPROVER 역할 최소 1명 클라 사전검증(Open
 *     Q#1, 도메인모델 "결재자 최소 1명 이상 등록") 후 SALES_DRAFT_CREATE_SUBMISSION.
 * 두 진입 모두 동일 zod 사전검증(submitWithErrorMapping)을 거치며, 상신은 그 위에 결재선 가드를
 * 더한다(최종 판정은 서버). 생성 성공(201 {draftId}) 시 approvalKeys.all invalidate(mutation)
 * 후 토스트를 띄우고 새 기안 상세로 이동한다.
 *
 * 공람(선택): 생성 요청 body에는 공람 필드가 없으므로(request-fields 실측) 화면에서 지정한
 * 공람자는 생성 성공 후 `addCirculation`(F707) 후속 호출로 등록한다. 실패해도 기안은 이미
 * 생성됐으므로 이동을 막지 않고 상세 화면에서의 재추가를 토스트로 안내한다.
 */
export function SalesDraftCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useSalesDraftCreateMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  // 결재선 행별 역할(empId → 결재/협조). 미지정 empId는 기본 APPROVER로 매핑한다.
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

  // 기안 내용 자동 입력(레퍼런스 이식): 본문을 직접 수정하기 전까지 매출 필드 값으로 본문을
  // 구성한다. 생성 문자열이 현재 값과 같으면 setValue를 건너뛰어 불필요한 갱신 루프를 막는다.
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

  /**
   * [매출액 불러오기](FRANCHISE_SALES_MONTHLY): 가맹점·보고월 선행 조건을 안내 토스트로 가드한 뒤
   * 월 매출을 조회해 totalSalesAmount를 매출액 필드에 주입한다. 서버 에러(권한/미존재 등)는
   * handleApiError 표준 정책(토스트)으로 위임한다.
   */
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
      // 매출 없음은 204 빈 바디 → axios data가 빈 문자열(FranchiseSalesPage T3.1 실측과 동일).
      // 이때 필드 접근이 전부 undefined가 되므로 주입 없이 안내하고 끝낸다.
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

  async function onValid(values: SalesDraftFormValues, submit: boolean) {
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

    const payload: SalesDraftPayload = {
      param: { title: values.title, content: values.content, approvers },
      franchiseId: values.franchiseId,
      reportMonth: values.reportMonth,
      salesAmount: values.salesAmount,
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
    toast.success(submit ? '매출 기안서를 상신했습니다' : '매출 기안서를 임시저장했습니다')
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
      {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-4">
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

        {/* 유형 필드를 본문보다 앞에 둔다(레퍼런스 필드 순서: 제목 → 유형 필드 → 기안 내용). */}
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
              {/* 레퍼런스의 라벨 우측 [매출액 불러오기] 링크 버튼 이식(여기서는 실 API 연동). */}
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sales-draft-content">
            기안 내용 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="sales-draft-content"
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
