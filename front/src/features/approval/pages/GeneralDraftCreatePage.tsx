import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { addCirculation } from '../api/addCirculation'
import { useGeneralDraftCreateMutation } from '../api/useGeneralDraftCreateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
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
import { generalDraftSchema, type GeneralDraftFormValues } from '../model/generalDraftSchema'

/**
 * 일반 기안 작성 페이지(F720 `GENERAL_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(DRAFT-COMMON) T1.3,
 * docs/prd/8.general-draft-prd.md §일반 기안 작성 페이지).
 *
 * ①공통 `CancellationDraftDialog`의 폼 로직(제목·본문 RHF+zod + EmployeePicker 결재선 + 2버튼 +
 * approverSelection→ApproverParam[] 매핑 + 성공 후 상세 이동)을 페이지로 이식한 것이다.
 * 레이아웃은 공통 `DraftCreateFrame`(좌측 종류 선택 카드 + 우측 폼 카드)을 따른다. 첨부 UI는
 * 없다(Minor m3 — 첨부는 생성 후 상세 AttachmentSection에서 관리).
 *
 * 결재선은 EmployeePicker 로컬 선택 상태(zod 스키마 밖)라 선택 순서를 order(1-base)로 매핑하고,
 * role은 행별 select(결재/협조 — approverRoles state)로 지정한다(기본 APPROVER). 두 버튼:
 *   - [임시저장으로 생성](type=button): 결재선 없이 허용(GENERAL_DRAFT_CREATE, UNSUBMITTED).
 *   - [생성 후 상신](type=submit): 결재선 최소 1명 + APPROVER 역할 최소 1명 클라 사전검증(Open
 *     Q#1, 도메인모델 "결재자 최소 1명 이상 등록") 후 GENERAL_DRAFT_CREATE_SUBMISSION.
 * 두 진입 모두 동일 zod 사전검증(submitWithErrorMapping)을 거치며, 상신은 그 위에 결재선 가드를
 * 더한다(최종 판정은 서버). 생성 성공(201 {draftId}) 시 approvalKeys.all invalidate(mutation) 후
 * 토스트를 띄우고 새 기안 상세로 이동한다(Open Q#2).
 *
 * 공람(선택): 생성 요청 body에는 공람 필드가 없으므로(request-fields 실측) 화면에서 지정한
 * 공람자는 생성 성공 후 `addCirculation`(F707) 후속 호출로 등록한다. 이 호출이 실패해도 기안은
 * 이미 생성됐으므로 이동을 막지 않고 상세 화면에서의 재시도를 토스트로 안내한다.
 */
export function GeneralDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useGeneralDraftCreateMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  // 결재선 행별 역할(empId → 결재/협조). 미지정 empId는 기본 APPROVER로 매핑한다.
  const [approverRoles, setApproverRoles] = useState<Record<number, ApprovalRole>>({})
  const [circulationSelection, setCirculationSelection] = useState<EmployeePickerEmployee[]>([])
  const [attachments, setAttachments] = useState<File[]>([])

  const form = useZodForm(generalDraftSchema, {
    defaultValues: { title: '', content: '' },
  })
  const {
    register,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

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

  async function onValid(values: GeneralDraftFormValues, submit: boolean) {
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

    const result = await mutation.mutateAsync({ payload: { ...values, approvers }, submit })
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
    toast.success(submit ? '기안서를 상신했습니다' : '기안서를 임시저장했습니다')
    navigate(`/approval/drafts/${result.draftId}`)
  }

  // [임시저장으로 생성]·[생성 후 상신] 두 진입 모두 동일 zod 사전검증을 거치도록 각각을
  // submitWithErrorMapping으로 감싼다(제출 실패는 handleApiError가 root 에러/토스트로 위임).
  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  // 미리보기 새 창(DRAFT_PRINT_PREVIEW_STORAGE_KEY 핸드오프, model/draftPreview.ts)에 넘길 폼
  // 스냅샷: 클릭 시점의 getValues()를 그대로 담는다. 제목·내용은 기안문 표 전용 필드로 분리하고
  // 일반기안서는 유형별 부가 fields가 없다(빈 배열).
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
      attachments: attachments.map((file) => file.name),
    }
    localStorage.setItem(DRAFT_PRINT_PREVIEW_STORAGE_KEY, JSON.stringify(payload))
    window.open('/approval/drafts/preview', '_blank', 'noopener,noreferrer')
  }

  return (
    <DraftCreateFrame
      currentType="general"
      attachments={attachments}
      onAttachmentsChange={setAttachments}
    >
      {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="general-draft-title" className="text-sm font-semibold">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="general-draft-title"
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
          <Label htmlFor="general-draft-content" className="text-sm font-semibold">
            기안 내용 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="general-draft-content"
            placeholder="기안 내용을 입력해주세요"
            className="min-h-48 rounded-xl leading-7"
            aria-invalid={!!errors.content}
            {...register('content')}
          />
          {errors.content && (
            <p role="alert" className="text-sm text-destructive">
              {errors.content.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 border-t pt-6">
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
