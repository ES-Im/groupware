import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { addCirculation } from '../api/addCirculation'
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { useCancellationDraftMutation } from '../api/useCancellationDraftMutation'
import { DraftAttachmentsCard, DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { getApprovalStatusBadge } from '../lib/approvalStatusBadge'
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
import { cancellationDraftSchema, type CancellationDraftFormValues } from '../model/cancellationDraftSchema'

function formatDocNumber(draftId: number): string {
  return `HARUON-DRAFT-${draftId}`
}

function GuardShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">{children}</div>
}

function CancellationDraftForm({
  sourceDraftId,
  source,
}: {
  sourceDraftId: number
  source: DraftDetailResponse
}) {
  const navigate = useNavigate()
  const mutation = useCancellationDraftMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>({})
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>([])
  const [attachments, setAttachments] = useState<File[]>([])

  const docNumber = formatDocNumber(sourceDraftId)

  const form = useZodForm(cancellationDraftSchema, {
    defaultValues: {
      title: `[취소] ${source.title}`,
      content: `[${docNumber}] "${source.title}" 기안을 아래 사유로 취소합니다.\n\n취소 사유: `,
    },
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

  async function onValid(values: CancellationDraftFormValues, submit: boolean) {
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

    const result = await mutation.mutateAsync({
      sourceDraftId,
      payload: { ...values, approvers },
      submit,
    })
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
    toast.success(submit ? '취소 기안을 상신했습니다' : '취소 기안을 임시저장했습니다')
    navigate(`/approval/drafts/${result.draftId}`)
  }

  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  function handlePreview() {
    const values = getValues()
    const previewFields: DraftPreviewField[] = [{ label: '원본 문서번호', value: docNumber }]
    const payload: DraftPrintPreviewPayload = {
      typeLabel: '취소기안서',
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

  const statusBadge = getApprovalStatusBadge(source.approvalStatus)

  return (
    <DraftCreateFrame
      currentType="general"
      title="취소 기안 작성"
      subtitle="결재완료된 문서에 대한 취소 기안을 작성합니다"
      formIcon={Ban}
      formTitle="취소 기안서"
      formDescription="결재완료된 원본 기안을 취소합니다"
      headerBadge="취소 기안"
      banner={
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Ban className="size-4" />
            취소 기안
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            문서번호 <span className="font-semibold">{docNumber}</span> “{source.title}”에 대한 취소
            기안입니다.
          </p>
        </div>
      }
      sidebar={
        <>
          <Card className="h-fit rounded-2xl">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-bold">원본 문서</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">문서번호</dt>
                  <dd className="font-semibold">{docNumber}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">제목</dt>
                  <dd className="font-medium break-words">{source.title}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">기안자</dt>
                  <dd className="font-medium">{source.drafter.empName}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">상태</dt>
                  <dd>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  </dd>
                </div>
              </dl>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-lg">
                <Link to={`/approval/drafts/${sourceDraftId}`}>원본 문서 보기</Link>
              </Button>
            </CardContent>
          </Card>
          <DraftAttachmentsCard attachments={attachments} onChange={setAttachments} />
        </>
      }
    >
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-6">
        <div className="grid min-h-0 flex-1 grid-rows-[4fr_1fr] gap-6">
          <div className="flex min-h-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cancellation-title" className="text-sm font-semibold">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cancellation-title"
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
              <Label htmlFor="cancellation-content" className="text-sm font-semibold">
                취소 사유 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancellation-content"
                placeholder="취소 사유를 입력해주세요"
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
          onCancel={() => navigate(`/approval/drafts/${sourceDraftId}`)}
          onPreview={handlePreview}
          onSaveDraft={() => void handleCreate()}
          saveLabel="임시저장"
          submitLabel="생성 후 상신"
        />
      </form>
    </DraftCreateFrame>
  )
}

export function CancellationDraftCreatePage() {
  const { draftId: draftIdParam } = useParams()

  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const sourceDraftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined

  const detailQuery = useDraftDetailQuery(sourceDraftId)
  const meQuery = useMeQuery()

  if (sourceDraftId === undefined) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">취소 기안 작성</h1>
        <p className="text-sm text-muted-foreground">원본 기안서를 찾을 수 없습니다.</p>
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
      ? '원본 기안서를 찾을 수 없습니다.'
      : isForbidden(apiError)
        ? '이 기안서를 조회할 권한이 없습니다.'
        : '원본 기안서를 불러오지 못했습니다.'
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">취소 기안 작성</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </GuardShell>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const source = detailQuery.data

  const myEmpId = meQuery.data?.empBasicInfo?.empId
  if (!resolveDrafterActions(source, myEmpId).canCancel) {
    return (
      <GuardShell>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">취소 기안 작성</h1>
        <p className="text-sm text-muted-foreground">
          이 문서는 취소 기안을 작성할 수 없습니다. 결재완료된 본인 기안이면서 아직 취소 기안이 없어야
          합니다.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
          <Link to={`/approval/drafts/${sourceDraftId}`}>원본 문서로 돌아가기</Link>
        </Button>
      </GuardShell>
    )
  }

  return <CancellationDraftForm sourceDraftId={sourceDraftId} source={source} />
}
