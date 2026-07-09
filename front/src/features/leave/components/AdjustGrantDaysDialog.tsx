import { useEffect } from 'react'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
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
import { useAdjustCompensatoryGrantDaysMutation } from '../api/useAdjustCompensatoryGrantDaysMutation'
import { useAdjustSpecialGrantDaysMutation } from '../api/useAdjustSpecialGrantDaysMutation'
import { adjustGrantDaysSchema, type AdjustGrantDaysFormValues } from '../model/adjustGrantDaysSchema'
import type { AdjustGrantDaysTarget } from '../model/leave'

interface AdjustGrantDaysDialogProps {
  /** 다이얼로그 열림 상태(제어형, AdminLeavePage가 소유). target이 null이 아닐 때만 true여야 한다. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 조정 대상(사원 + 특별/포상 축). 다이얼로그가 열려있는 동안에는 호출부가 항상 값을 채워 전달한다. */
  target: AdjustGrantDaysTarget | null
}

const LEAVE_KIND_LABEL: Record<AdjustGrantDaysTarget['leaveKind'], string> = {
  SPECIAL: '특별',
  COMPENSATORY: '포상',
}

/**
 * 부여일수 조정 다이얼로그(F749·F750, ROADMAP(LEAVE) M5 T5.3, ADMIN 전용).
 *
 * UpdateAttendanceDialog(T4.3)의 useZodForm/submitWithErrorMapping 표준 패턴을 그대로 이식한다.
 * 대상(target)이 요약 표(EmpLeaveSummaryTable) [특별 조정]/[포상 조정] 버튼 클릭마다 바뀌므로
 * defaultValues 고정 대신 open+target이 바뀔 때마다 reset()으로 폼을 채운다.
 *
 * target.leaveKind가 어느 mutation(특별=useAdjustSpecialGrantDaysMutation·포상=
 * useAdjustCompensatoryGrantDaysMutation)을 호출할지 결정한다 — 다이얼로그 안에 별도
 * 종류 선택 UI를 두지 않는다(요약 표 행에서 이미 종류가 확정되어 전달됨, PRD F749/F750을 별개
 * 액션으로 명시).
 *
 * 성공(204) 시 각 mutation 훅이 이미 요약(F747)·사용률(F748) invalidate와 성공 토스트를
 * 처리하므로, 이 컴포넌트는 다이얼로그를 닫기만 한다(중복 토스트 방지).
 */
export function AdjustGrantDaysDialog({ open, onOpenChange, target }: AdjustGrantDaysDialogProps) {
  const specialMutation = useAdjustSpecialGrantDaysMutation()
  const compensatoryMutation = useAdjustCompensatoryGrantDaysMutation()
  const mutation = target?.leaveKind === 'COMPENSATORY' ? compensatoryMutation : specialMutation

  const form = useZodForm(adjustGrantDaysSchema)
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다(target이 바뀔 때 포함) 폼을 비우고, 닫힐 때는 다음 오픈에 이전 입력값/에러가
  // 남지 않도록 리셋한다(UpdateAttendanceDialog와 동일 이유).
  useEffect(() => {
    if (open) {
      reset({ plusMinusDays: undefined })
    } else {
      reset()
    }
  }, [open, target, reset])

  async function handleSubmit(values: AdjustGrantDaysFormValues) {
    if (!target) {
      return
    }
    await mutation.mutateAsync({ empId: target.empId, plusMinusDays: values.plusMinusDays })
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(UpdateAttendanceDialog와
  // 동일 이유) — 그 사이에 닫히면 폼이 reset()되어 뒤늦게 도착하는 서버 판정 실패가 삼켜진다.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  const kindLabel = target ? LEAVE_KIND_LABEL[target.leaveKind] : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kindLabel} 휴가 부여일수 조정</DialogTitle>
          <DialogDescription>
            {target?.empName}님의 {kindLabel} 휴가 부여일수를 증감합니다. 음수를 입력하면 차감됩니다.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-grant-days">증감 일수</Label>
            <Input
              id="adjust-grant-days"
              type="number"
              step="0.5"
              placeholder="예: 1.5, -0.5"
              aria-invalid={!!errors.plusMinusDays}
              {...register('plusMinusDays', { valueAsNumber: true })}
            />
            {errors.plusMinusDays && (
              <p role="alert" className="text-sm text-destructive">
                {errors.plusMinusDays.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              조정
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
