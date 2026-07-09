import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useCancellationDraftMutation } from '../../api/useCancellationDraftMutation'
import type { ApproverParam } from '../../model/approverParam'
import {
  cancellationDraftSchema,
  type CancellationDraftFormValues,
} from '../../model/cancellationDraftSchema'
import { EmployeePicker, type EmployeePickerEmployee } from '../EmployeePicker'

interface CancellationDraftDialogProps {
  /** 취소 대상 원본 기안서 식별 번호(APPROVED 원본). path param으로 전송된다. */
  sourceDraftId: number
  /** 다이얼로그 열림 상태(제어형, DrafterActions 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 취소 기안 작성 다이얼로그(F704 `DRAFT_CANCELLATION_CREATE(_SUBMISSION)`, ROADMAP(DRAFT) T4.5).
 *
 * 기안자 + APPROVED 원본 + 취소기안 없음에서만 열린다(노출 판정은 DrafterActions=resolveDrafterActions).
 * title/content(RHF+zod, cancellationDraftSchema)와 결재선(EmployeePicker=T4.4 재사용)을 입력받아
 * [임시저장으로 생성](submit=false) 또는 [생성 후 상신](submit=true)한다. 결재선 선택 결과는
 * EmployeePicker의 선택 순서를 order(1-base)로, role은 APPROVER 고정으로 매핑한다(협조 결재자·역할
 * 구분 UI는 MVP 범위 밖). 선택이 없으면 approvers를 생략한다(계약상 optional — 상신 시 결재선이
 * 필요하면 서버가 도메인 에러로 판정하며, 그 실패는 handleApiError가 처리).
 *
 * 성공(201, {draftId}) 시: mutation onSuccess가 approvalKeys.all을 invalidate한 뒤, 이 컴포넌트가
 * 토스트를 띄우고 다이얼로그를 닫은 다음 새로 생성된 취소기안 상세로 이동한다(T2.5 등록 라우트 재사용).
 * 닫힐 때마다 폼·선택을 리셋해 다음에 열 때 이전 입력이 남지 않게 한다(제어형이라 명시적 리셋 필요).
 */
export function CancellationDraftDialog({
  sourceDraftId,
  open,
  onOpenChange,
}: CancellationDraftDialogProps) {
  const navigate = useNavigate()
  const mutation = useCancellationDraftMutation()
  const [approverSelection, setApproverSelection] = useState<EmployeePickerEmployee[]>([])

  const form = useZodForm(cancellationDraftSchema, {
    defaultValues: { title: '', content: '' },
  })
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (!open) {
      reset()
      setApproverSelection([])
    }
  }, [open, reset])

  async function onValid(values: CancellationDraftFormValues, submit: boolean) {
    const approvers: ApproverParam[] | undefined =
      approverSelection.length > 0
        ? approverSelection.map((emp, index) => ({
            approverId: emp.empId,
            role: 'APPROVER',
            order: index + 1,
          }))
        : undefined

    const result = await mutation.mutateAsync({
      sourceDraftId,
      payload: { ...values, approvers },
      submit,
    })
    toast.success(submit ? '취소 기안을 상신했습니다' : '취소 기안을 임시저장했습니다')
    onOpenChange(false)
    navigate(`/approval/drafts/${result.draftId}`)
  }

  // [임시저장으로 생성]·[생성 후 상신] 두 진입 모두 동일 zod 사전검증을 거치도록 각각을
  // submitWithErrorMapping으로 감싼다(제출 실패는 handleApiError가 root 에러/토스트로 위임).
  const handleCreate = submitWithErrorMapping(form, (values) => onValid(values, false))
  const handleCreateAndSubmit = submitWithErrorMapping(form, (values) => onValid(values, true))

  // 제출 중에는 Esc·오버레이 클릭·닫기를 무시한다(RegisterDepartmentDialog와 동일 가드) —
  // 제출 도중 닫히면 폼이 reset되어 뒤늦은 실패가 사용자에게 표시되지 않고 삼켜지기 때문이다.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>취소 기안 작성</DialogTitle>
          <DialogDescription>
            결재완료된 원본 기안에 대한 취소 기안을 작성합니다. 임시저장 후 상신하거나 바로 상신할 수
            있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* form onSubmit은 기본 액션([생성 후 상신])으로 둔다. [임시저장]은 type=button으로 분리. */}
        <form noValidate onSubmit={handleCreateAndSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancellation-title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cancellation-title"
              placeholder="제목"
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
            <Label htmlFor="cancellation-content">
              본문 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancellation-content"
              placeholder="취소 사유 등 본문을 입력해주세요"
              rows={4}
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
            <Label>결재선</Label>
            <EmployeePicker selected={approverSelection} onChange={setApproverSelection} />
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              임시저장으로 생성
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              생성 후 상신
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
