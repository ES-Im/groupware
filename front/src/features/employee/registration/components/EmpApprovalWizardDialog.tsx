import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useZodForm } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useApproveEmpRegistrationMutation } from '../api/useApproveEmpRegistrationMutation'
import { useUpdateEmpBelongingsMutation } from '../api/useUpdateEmpBelongingsMutation'
import { EmpBelongingsAssignmentForm } from './EmpBelongingsAssignmentForm'
import {
  approveEmpRegistrationSchema,
  type ApproveEmpRegistrationFormValues,
} from '../model/approveEmpRegistrationSchema'
import type { EmpBelongingsFormValues } from '../model/empBelongingsFormSchema'
import type { PositionCode } from '../model/positionCode'

const WIZARD_STEPS = [
  { step: 1, label: '가입 승인' },
  { step: 2, label: '소속 배정' },
] as const

interface EmpApprovalWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empId: number
  empName: string
  loginId: string
  onApproveSuccess: (hiredAt: string) => void
  /**
   * 1단계 승인 실패(예: 이미 ACTIVE인 대상에 재승인 시도 등 도메인 에러) 콜백(ROADMAP T2.5).
   * 호스트(NewEmployeeApprovalListPage)가 토스트 노출·다이얼로그 닫기·목록 invalidate를 전담하므로,
   * 이 다이얼로그는 에러를 그대로 위로 전달하기만 하고 폼 root 에러로 인라인 매핑하지 않는다.
   */
  onApproveError: (error: unknown) => void
}

/**
 * 신규 사원 가입 승인 2단계 마법사 다이얼로그(F002/F003, HR/ADMIN 전용).
 * 1단계(가입 승인)와 2단계(조직 소속 최초 배정, T3.6 폼)를 이 지점(T3.7)에서 연결한다 —
 * 소속 배정은 대상이 ACTIVE일 때만 가능해 승인이 반드시 선행해야 하므로(도메인 규칙)
 * 마법사 단계로 순서를 강제한다.
 * 이 프로젝트 최초의 다단계 다이얼로그라 범용 Wizard 추상화 대신 로컬 step state로 국한한다(YAGNI).
 */
export function EmpApprovalWizardDialog({
  open,
  onOpenChange,
  empId,
  empName,
  loginId,
  onApproveSuccess,
  onApproveError,
}: EmpApprovalWizardDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [approvedHiredAt, setApprovedHiredAt] = useState<string>()

  const mutation = useApproveEmpRegistrationMutation()
  const assignMutation = useUpdateEmpBelongingsMutation()
  const form = useZodForm(approveEmpRegistrationSchema, { defaultValues: { hiredAt: '' } })
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  // 다이얼로그가 열릴 때마다 1단계부터, 폼 값도 함께 초기화한다 — host(NewEmployeeApprovalListPage,
  // T2.5)가 대상 사원이 바뀔 때마다 이 다이얼로그를 새로 열므로, open 변화를 기준으로 리셋해
  // 직전 사원의 hiredAt이 다음 대상에게 남지 않게 한다.
  useEffect(() => {
    if (open) {
      setStep(1)
      setApprovedHiredAt(undefined)
      reset({ hiredAt: '' })
    }
  }, [open, reset])

  async function handleApprove(values: ApproveEmpRegistrationFormValues) {
    try {
      await mutation.mutateAsync({ empId, hiredAt: values.hiredAt })
    } catch (error) {
      onApproveError(error)
      return
    }
    setApprovedHiredAt(values.hiredAt)
    onApproveSuccess(values.hiredAt)
    setStep(2)
  }

  // 실패 시 에러는 EmpBelongingsAssignmentForm 내부의 submitWithErrorMapping이 errors.root로
  // 매핑해 2단계에 그대로 머무른다 — 여기서 잡지 않고 그대로 던진다(승인 mutation을 참조하지
  // 않으므로 재승인 호출은 구조적으로 발생하지 않는다).
  async function handleAssign(values: EmpBelongingsFormValues) {
    await assignMutation.mutateAsync({
      empId,
      payload: {
        deptId: Number(values.deptId),
        position: values.position as PositionCode,
        isPrimary: true,
        startAt: values.startAt,
        endAt: null,
      },
    })
    toast.success('소속을 배정했습니다')
    onOpenChange(false)
  }

  // 승인 완료(2단계 진입) 후 닫으려는 시도는 경고만 노출하고 닫힘 자체는 허용한다(PRD Open Q#2 확정).
  // 요청 in-flight 중 닫기 차단(isSubmitting/assignMutation.isPending)은 그와 무관한 별개의
  // 안전장치라 1단계와 동일하게 유지한다 — Q#2는 "진행 중이 아닐 때"의 이탈 경고를 다룬 것이다.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && (isSubmitting || assignMutation.isPending)) {
      return
    }
    if (!nextOpen && step === 2) {
      toast.warning('승인은 완료되었으나 소속이 배정되지 않았습니다')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>신규 사원 승인</DialogTitle>
          <DialogDescription>가입을 승인한 뒤 조직 소속을 배정하는 2단계 절차입니다.</DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2 text-sm">
          {WIZARD_STEPS.map(({ step: s, label }, index) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : step > s
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {s}
              </span>
              <span className={step === s ? 'font-medium text-foreground' : 'text-muted-foreground'}>{label}</span>
              {index < WIZARD_STEPS.length - 1 && (
                <span className="mx-1 h-px w-4 bg-border" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        {step === 1 ? (
          <form noValidate onSubmit={handleSubmit(handleApprove)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
              <span className="font-medium text-foreground">{empName}</span>
              <span className="text-muted-foreground">{loginId}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wizard-hired-at">입사일자</Label>
              <Input id="wizard-hired-at" type="date" aria-invalid={!!errors.hiredAt} {...register('hiredAt')} />
              {errors.hiredAt && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.hiredAt.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  취소
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                승인
              </Button>
            </DialogFooter>
          </form>
        ) : (
          approvedHiredAt !== undefined && (
            <EmpBelongingsAssignmentForm defaultStartAt={approvedHiredAt} onSubmit={handleAssign} />
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
