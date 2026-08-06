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
  onApproveError: (error: unknown) => void
}

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
