import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useGeneralDraftCreateMutation } from '../api/useGeneralDraftCreateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { DraftPreviewDialog, type DraftPreviewField } from '../components/DraftPreviewDialog'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '../components/EmployeePicker'
import type { ApproverParam } from '../model/approverParam'
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
 * 결재선은 EmployeePicker 로컬 선택 상태(zod 스키마 밖)라 선택 순서를 order(1-base)로, role은
 * APPROVER 고정으로 매핑한다(협조 결재자 지정은 범위 밖). 두 버튼:
 *   - [임시저장으로 생성](type=button): 결재선 없이 허용(GENERAL_DRAFT_CREATE, UNSUBMITTED).
 *   - [생성 후 상신](type=submit): 결재선 최소 1명 클라 사전검증(Open Q#1) 후 GENERAL_DRAFT_CREATE_SUBMISSION.
 * 두 진입 모두 동일 zod 사전검증(submitWithErrorMapping)을 거치며, 상신은 그 위에 결재선 개수
 * 가드를 더한다(최종 판정은 서버 — 도메인모델 "상신=결재자 1명 이상 필수"). 생성 성공(201 {draftId})
 * 시 approvalKeys.all invalidate(mutation) 후 토스트를 띄우고 새 기안 상세로 이동한다(Open Q#2).
 */
export function GeneralDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useGeneralDraftCreateMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)

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

  async function onValid(values: GeneralDraftFormValues, submit: boolean) {
    // [생성 후 상신]만 결재선 최소 1명을 클라 사전검증한다(Open Q#1). 결재선은 EmployeePicker
    // 로컬 상태라 zod 밖에서 검사하며, 위반 시 root 에러로 안내하고 요청을 보내지 않는다.
    if (submit && approverSelection.length === 0) {
      setError('root', { message: '상신하려면 결재선에 최소 1명을 지정해주세요' })
      return
    }

    const approvers: ApproverParam[] | undefined =
      approverSelection.length > 0
        ? approverSelection.map((emp, index) => ({
            approverId: emp.empId,
            role: 'APPROVER',
            order: index + 1,
          }))
        : undefined

    const result = await mutation.mutateAsync({ payload: { ...values, approvers }, submit })
    toast.success(submit ? '기안서를 상신했습니다' : '기안서를 임시저장했습니다')
    navigate(`/approval/drafts/${result.draftId}`)
  }

  // [임시저장으로 생성]·[생성 후 상신] 두 진입 모두 동일 zod 사전검증을 거치도록 각각을
  // submitWithErrorMapping으로 감싼다(제출 실패는 handleApiError가 root 에러/토스트로 위임).
  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  // 미리보기용 스냅샷: 모달 열림 토글이 리렌더를 유발하므로 그 시점의 getValues()가 최신값이다.
  const previewValues = getValues()
  const previewFields: DraftPreviewField[] = [
    { label: '제목', value: previewValues.title },
    { label: '기안 내용', value: previewValues.content },
  ]

  return (
    <DraftCreateFrame currentType="general">
      {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="general-draft-title">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="general-draft-title"
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
          <Label htmlFor="general-draft-content">
            기안 내용 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="general-draft-content"
            placeholder="기안 내용을 입력해주세요"
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

        <div className="border-t pt-4">
          {/* 선택이 바뀌면 결재선 미지정 root 에러를 즉시 해제해 상신 재시도를 막지 않는다. */}
          <EmployeeSelectField
            label="결재선"
            description="결재 순서대로 처리됩니다."
            ordered
            roleBadge="결재"
            emptyText="결재선에 지정된 결재자가 없습니다."
            selected={approverSelection}
            onChange={(next) => {
              setApproverSelection(next)
              if (next.length > 0) {
                clearErrors('root')
              }
            }}
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
          onPreview={() => setPreviewOpen(true)}
          onSaveDraft={() => void handleCreate()}
        />
      </form>

      <DraftPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        typeLabel="일반기안서"
        fields={previewFields}
        approvers={approverSelection}
      />
    </DraftCreateFrame>
  )
}
