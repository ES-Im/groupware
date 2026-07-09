import { useEffect } from 'react'
import dayjs from 'dayjs'
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
import { Textarea } from '@/shared/ui/textarea'
import { useUpdateAttendanceMutation } from '../api/useUpdateAttendanceMutation'
import type { AttendanceEditTarget } from '../model/deptAttendance'
import { updateAttendanceSchema, type UpdateAttendanceFormValues } from '../model/updateAttendanceSchema'

interface UpdateAttendanceDialogProps {
  /** 다이얼로그 열림 상태(제어형, DeptAttendancePage가 소유). target이 null이 아닐 때만 true여야 한다. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 수정 대상 근태 1건. 다이얼로그가 열려있는 동안에는 호출부가 항상 값을 채워 전달한다. */
  target: AttendanceEditTarget | null
}

/**
 * 부서 근태 수정 다이얼로그(F307, `DEPT_ATTENDANCE_UPDATE`, ROADMAP2 T4.3, DEPT_MANAGER 전용).
 *
 * RegisterDepartmentDialog(T8.1)의 T1.1 useZodForm/submitWithErrorMapping 표준 패턴을 그대로
 * 이식한다. RenameDepartmentDialog(T9.2, deptId/currentName이 항상 고정된 단일 대상)와 달리
 * 이 다이얼로그의 대상(target)은 탭①(월별)·탭② (승인대기) 두 표의 여러 행/항목 중 어느 것이든
 * 될 수 있어 매번 동적으로 바뀐다 — 그래서 defaultValues 고정 대신 open+target이 바뀔 때마다
 * reset()으로 폼을 채운다.
 *
 * targetEmpId는 updateAttendanceSchema(T4.1)가 이미 필수 필드로 선언해 두었지만 사용자가
 * 직접 입력하는 네이티브 요소가 없다(AppointDepartmentLeaderDialog의 deptId처럼 스키마 밖 prop으로
 * 넘기지 않는 이유는 서버 요청 바디 자체가 targetEmpId를 필수로 요구하기 때문, updateAttendance.ts
 * 참조) — register() 없이 reset()의 값으로만 채워 넣으면 RHF가 그 값을 그대로 제출 데이터에
 * 유지한다.
 *
 * editedAt은 폼 필드가 아니라(updateAttendanceSchema.ts 주석 참조) 제출 시점에
 * `dayjs().format('YYYY-MM-DDTHH:mm:ss')`(오프셋 없는 로컬 wall-clock, T4.2/T4.4에서 확립된
 * 컨벤션 — `toISOString()`을 쓰면 서버가 9시간 이전 값으로 파싱한다)로 합성해 mutation payload에
 * 동봉한다.
 *
 * 성공(204) 시 useUpdateAttendanceMutation(T4.2)이 이미 두 탭(월별·승인대기) invalidate와 성공
 * 토스트를 처리하므로, 이 컴포넌트는 다이얼로그를 닫기만 한다(RegisterDepartmentDialog와 달리
 * 여기서 별도로 toast.success를 호출하지 않는다 — 중복 토스트 방지).
 */
export function UpdateAttendanceDialog({ open, onOpenChange, target }: UpdateAttendanceDialogProps) {
  const mutation = useUpdateAttendanceMutation()
  const form = useZodForm(updateAttendanceSchema, {
    defaultValues: { targetEmpId: 0, startAt: '', endAt: '', editReason: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다(target이 바뀔 때 포함) 대상 근태의 현재 시각으로 채우고, 닫힐 때는 다음 오픈에
  // 이전 입력값/에러가 남지 않도록 리셋한다(RegisterDepartmentDialog/RenameDepartmentDialog와 동일 이유).
  useEffect(() => {
    if (open && target) {
      reset({
        targetEmpId: target.targetEmpId,
        startAt: target.startAt ?? '',
        endAt: target.endAt ?? '',
        editReason: '',
      })
    } else if (!open) {
      reset()
    }
  }, [open, target, reset])

  async function handleSubmit(values: UpdateAttendanceFormValues) {
    if (!target) {
      return
    }
    await mutation.mutateAsync({
      attendanceId: target.attendanceId,
      payload: { ...values, editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss') },
    })
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(RegisterDepartmentDialog와
  // 동일 이유) — 그 사이에 다이얼로그가 닫히면 폼이 reset()되어, 뒤늦게 도착하는 수정 실패(이미 승인된
  // 건 수정 등 서버 판정 위반)가 사용자에게 표시되지 않고 그대로 삼켜지기 때문이다.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>근태 수정</DialogTitle>
          <DialogDescription>
            출퇴근 시각과 수정 사유를 입력해 근태 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-start-at">시작 시각</Label>
            <Input
              id="attendance-start-at"
              type="time"
              step={1}
              aria-invalid={!!errors.startAt}
              {...register('startAt')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-end-at">종료 시각</Label>
            <Input
              id="attendance-end-at"
              type="time"
              step={1}
              aria-invalid={!!errors.endAt}
              {...register('endAt')}
            />
          </div>

          {errors.startAt && (
            <p role="alert" className="text-sm text-destructive">
              {errors.startAt.message}
            </p>
          )}
          {errors.endAt && (
            <p role="alert" className="text-sm text-destructive">
              {errors.endAt.message}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-edit-reason">
              수정 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="attendance-edit-reason"
              placeholder="수정 사유를 입력해주세요"
              maxLength={100}
              aria-invalid={!!errors.editReason}
              className="min-h-16"
              {...register('editReason')}
            />
            {errors.editReason && (
              <p role="alert" className="text-sm text-destructive">
                {errors.editReason.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            {/* 취소: DialogClose가 onOpenChange(false)를 호출하므로 상위 handleOpenChange의
                in-flight 닫힘 가드를 그대로 탄다. 제출 중에는 명시적으로 비활성화한다. */}
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              수정
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
