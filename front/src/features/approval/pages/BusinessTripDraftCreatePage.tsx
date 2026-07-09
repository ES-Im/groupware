import { useState } from 'react'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import type { BusinessTripDraftPayload } from '../api/createBusinessTripDraft'
import { useBusinessTripDraftCreateMutation } from '../api/useBusinessTripDraftCreateMutation'
import { DraftCreateFrame } from '../components/DraftCreateFrame'
import { DraftFormActions } from '../components/DraftFormActions'
import { DraftPreviewDialog, type DraftPreviewField } from '../components/DraftPreviewDialog'
import { EmployeeSelectField } from '../components/EmployeeSelectField'
import { type EmployeePickerEmployee } from '../components/EmployeePicker'
import type { ApproverParam } from '../model/approverParam'
import {
  businessTripDraftSchema,
  type BusinessTripDraftFormValues,
} from '../model/businessTripDraftSchema'

/**
 * datetime-local 입력값(`yyyy-MM-ddTHH:mm`, 분 단위)을 서버가 기대하는
 * `yyyy-MM-dd'T'HH:mm:ss`(초 보정)로 변환한다(ROADMAP(DRAFT-BUSINESSTRIP) T1.3 §날짜 정밀도).
 */
function toRequestDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
}

/** 미리보기용 일시 표기(`yyyy-MM-dd HH:mm`). 빈 값은 그대로 빈 문자열로 둔다("-" 대체는 모달 책임). */
function toDisplayDateTime(value: string): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

/**
 * 출장 기안 작성 페이지(F730 `BUSINESS_TRIP_DRAFT_CREATE(_SUBMISSION)`, ROADMAP(DRAFT-BUSINESSTRIP) T1.3,
 * docs/prd/10.businesstrip-draft-prd.md §출장 기안 작성 페이지).
 *
 * ②`GeneralDraftCreatePage`(F720)의 폼 로직(제목·본문 RHF+zod + EmployeePicker 결재선 + 2버튼 +
 * approverSelection→ApproverParam[] 매핑 + 성공 후 상세 이동)을 동형 복제하되, 출장 전용 필드
 * (출장 기간·목적지·목적)와 두 번째 EmployeePicker(참여자)를 추가한다. 레이아웃은 공통
 * `DraftCreateFrame`을 따른다. 첨부 UI는 없다(생성 후 상세 AttachmentSection에서 관리 — ②선례).
 *
 * 결재선·참여자는 둘 다 EmployeePicker 로컬 선택 상태(zod 스키마 밖)다:
 *   - 결재선: 선택 순서 → order(1-base), role은 APPROVER 고정 → ApproverParam[](param.approvers).
 *   - 참여자: 선택 순서 무관 → empId 목록(participantIds, 최상위 형제 필드).
 * 두 버튼:
 *   - [임시저장으로 생성](type=button): 결재선 없이 허용(BUSINESS_TRIP_DRAFT_CREATE, UNSUBMITTED).
 *   - [생성 후 상신](type=submit): 결재선 최소 1명 클라 사전검증(Open Q#1) 후
 *     BUSINESS_TRIP_DRAFT_CREATE_SUBMISSION.
 * 두 진입 모두 동일 zod 사전검증(submitWithErrorMapping)을 거치며, 상신은 그 위에 결재선 개수
 * 가드를 더한다(최종 판정은 서버). 생성 성공(201 {draftId}) 시 approvalKeys.all invalidate(mutation)
 * 후 토스트를 띄우고 새 기안 상세로 이동한다.
 */
export function BusinessTripDraftCreatePage() {
  const navigate = useNavigate()
  const mutation = useBusinessTripDraftCreateMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])
  const [participantSelection, setParticipantSelection] = useState<EmployeePickerEmployee[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const form = useZodForm(businessTripDraftSchema, {
    defaultValues: { title: '', content: '', destination: '', purpose: '', startAt: '', endAt: '' },
  })
  const {
    register,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

  async function onValid(values: BusinessTripDraftFormValues, submit: boolean) {
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

    const participantIds: number[] | undefined =
      participantSelection.length > 0 ? participantSelection.map((emp) => emp.empId) : undefined

    const payload: BusinessTripDraftPayload = {
      param: { title: values.title, content: values.content, approvers },
      startAt: toRequestDateTime(values.startAt),
      endAt: toRequestDateTime(values.endAt),
      destination: values.destination,
      purpose: values.purpose,
      participantIds,
    }

    const result = await mutation.mutateAsync({ payload, submit })
    toast.success(submit ? '출장 기안서를 상신했습니다' : '출장 기안서를 임시저장했습니다')
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
    { label: '출장 시작', value: toDisplayDateTime(previewValues.startAt) },
    { label: '출장 종료', value: toDisplayDateTime(previewValues.endAt) },
    { label: '출장지', value: previewValues.destination },
    { label: '출장 목적', value: previewValues.purpose },
    { label: '참여자', value: participantSelection.map((emp) => emp.empName).join(', ') },
  ]

  return (
    <DraftCreateFrame currentType="business-trip">
      {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
      <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="business-trip-draft-title">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="business-trip-draft-title"
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
          <Label htmlFor="business-trip-draft-content">
            기안 내용 <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="business-trip-draft-content"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-trip-draft-start-at">
              출장 시작 일시 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="business-trip-draft-start-at"
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
            <Label htmlFor="business-trip-draft-end-at">
              출장 종료 일시 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="business-trip-draft-end-at"
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="business-trip-draft-destination">
            출장지 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="business-trip-draft-destination"
            placeholder="출장지를 입력해주세요"
            aria-invalid={!!errors.destination}
            {...register('destination')}
          />
          {errors.destination && (
            <p role="alert" className="text-sm text-destructive">
              {errors.destination.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="business-trip-draft-purpose">
            출장 목적 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="business-trip-draft-purpose"
            placeholder="출장 목적을 입력해주세요"
            aria-invalid={!!errors.purpose}
            {...register('purpose')}
          />
          {errors.purpose && (
            <p role="alert" className="text-sm text-destructive">
              {errors.purpose.message}
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

        <EmployeeSelectField
          label="참여자 (선택)"
          description="출장에 함께하는 사원을 선택합니다."
          emptyText="선택된 참여자가 없습니다."
          selected={participantSelection}
          onChange={setParticipantSelection}
        />

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
        typeLabel="출장신청서"
        fields={previewFields}
        approvers={approverSelection}
      />
    </DraftCreateFrame>
  )
}
