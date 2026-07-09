import { useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import type { LeaveDraftPayload } from '../api/createLeaveDraft'
import { useLeaveDraftCreateMutation } from '../api/useLeaveDraftCreateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { DraftPreviewDialog, type DraftPreviewField } from '../components/DraftPreviewDialog'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '../components/EmployeePicker'
import type { ApproverParam } from '../model/approverParam'
import { leaveDraftSchema, leaveTypeOptions, type LeaveDraftFormValues } from '../model/leaveDraftSchema'

/**
 * datetime-local 입력값(`yyyy-MM-ddTHH:mm`, 분 단위)을 서버가 기대하는
 * `yyyy-MM-dd'T'HH:mm:ss`(초 보정)로 변환한다(ROADMAP(LEAVE) T1.3 §날짜 정밀도, ③선례 동형).
 */
function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

/** 미리보기용 일시 표기(`yyyy-MM-dd HH:mm`). 빈 값은 그대로 빈 문자열로 둔다("-" 대체는 모달 책임). */
function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

/**
 * 휴가 기안 작성 페이지(F740 `LEAVE_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(LEAVE) T1.3,
 * docs/prd/11.leave-draft-prd.md §휴가 기안 작성 페이지).
 *
 * ③`BusinessTripDraftCreatePage`(F730)의 폼 로직(제목·본문 RHF+zod + EmployeePicker 결재선 + 2버튼 +
 * approverSelection→ApproverParam[] 매핑 + 성공 후 상세 이동)을 동형 이식하되, 출장 전용 필드
 * (목적지·목적·참여자 picker)를 제거하고 휴가 유형 Select 하나로 치환한다. 레이아웃은 공통
 * `DraftCreateFrame`을 따른다. 첨부 UI는 없다(생성 후 상세 AttachmentSection에서 관리 — ②③선례).
 *
 * 휴가 유형 Select는 shadcn Select 미도입 상태라 근태 `DeptAttendancePage`가 확립한 네이티브
 * `<select>`(shadcn Input 톤 클래스) 컨벤션을 그대로 따른다(신규 컴포넌트 발명 아님).
 *
 * 결재선은 EmployeePicker 로컬 선택 상태(zod 스키마 밖)다: 선택 순서 → order(1-base), role은
 * APPROVER 고정 → ApproverParam[](param.approvers). 두 버튼:
 *   - [임시저장으로 생성](type=button): 결재선 없이 허용(LEAVE_DRAFT_CREATE, UNSUBMITTED).
 *   - [생성 후 상신](type=submit): 결재선 최소 1명 클라 사전검증(Open Q#1) 후
 *     LEAVE_DRAFT_CREATE_SUBMISSION.
 * 두 진입 모두 동일 zod 사전검증(submitWithErrorMapping)을 거치며, 상신은 그 위에 결재선 개수
 * 가드를 더한다(최종 판정은 서버). 생성 성공(201 {draftId}) 시 approvalKeys.all invalidate(mutation)
 * 후 토스트를 띄우고 새 기안 상세로 이동한다.
 */
export function LeaveDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useLeaveDraftCreateMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const form = useZodForm(leaveDraftSchema, {
    defaultValues: { title: '', content: '', leaveType: undefined, startAt: '', endAt: '' },
  })
  const {
    register,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

  async function onValid(values: LeaveDraftFormValues, submit: boolean) {
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

    const payload: LeaveDraftPayload = {
      param: { title: values.title, content: values.content, approvers },
      startAt: toRequestDateTime(values.startAt),
      endAt: toRequestDateTime(values.endAt),
      leaveType: values.leaveType,
    }

    const result = await mutation.mutateAsync({ payload, submit })
    toast.success(submit ? '휴가 기안서를 상신했습니다' : '휴가 기안서를 임시저장했습니다')
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
    {
      label: '휴가 유형',
      value: leaveTypeOptions.find((option) => option.value === previewValues.leaveType)?.label,
    },
    { label: '휴가 시작', value: toDisplayDateTime(previewValues.startAt) },
    { label: '휴가 종료', value: toDisplayDateTime(previewValues.endAt) },
  ]

  return (
    <DraftCreateFrame currentType="leave">
      {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-draft-title">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="leave-draft-title"
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
          <Label htmlFor="leave-draft-content">
            기안 내용 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="leave-draft-content"
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leave-draft-leave-type">
            휴가 유형 <span className="text-destructive">*</span>
          </Label>
          <select
            id="leave-draft-leave-type"
            aria-invalid={!!errors.leaveType}
            defaultValue=""
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            {...register('leaveType')}
          >
            <option value="" disabled>
              휴가 유형을 선택해주세요
            </option>
            {leaveTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.leaveType && (
            <p role="alert" className="text-sm text-destructive">
              {errors.leaveType.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leave-draft-start-at">
              휴가 시작 일시 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="leave-draft-start-at"
              type="datetime-local"
              aria-invalid={!!errors.startAt}
              {...register('startAt')}
            />
            {errors.startAt && (
              <p role="alert" className="text-sm text-destructive">
                {errors.startAt.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leave-draft-end-at">
              휴가 종료 일시 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="leave-draft-end-at"
              type="datetime-local"
              aria-invalid={!!errors.endAt}
              {...register('endAt')}
            />
            {errors.endAt && (
              <p role="alert" className="text-sm text-destructive">
                {errors.endAt.message}
              </p>
            )}
          </div>
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
        typeLabel="연가신청"
        fields={previewFields}
        approvers={approverSelection}
      />
    </DraftCreateFrame>
  )
}
