import { useEffect } from 'react'
import { toast } from 'sonner'
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
import { useAppointDepartmentLeaderMutation } from '../api/useAppointDepartmentLeaderMutation'
import {
  appointDepartmentLeaderSchema,
  type AppointDepartmentLeaderFormValues,
} from '../model/appointDepartmentLeaderSchema'
import type { DeptMemberResponse } from '../model/deptMember'

interface AppointDepartmentLeaderDialogProps {
  /** 다이얼로그 열림 상태(제어형, DepartmentDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  deptId: number
  /** 부서장 후보 목록. 현재 페이지에 로드된 부서 멤버(DEPT_MEMBERS 응답)를 그대로 사용한다. */
  members: DeptMemberResponse[]
}

/**
 * 부서장 지정 다이얼로그(F208, `DEPT_APPOINT_LEADER`, ROADMAP T9.2, ADMIN 전용).
 *
 * RegisterDepartmentDialog(T8.1)의 T1.1 표준 폼 패턴을 재사용하되, 이 저장소 최초로 멤버 1인을
 * 선택하는 콤보박스(네이티브 `<select>`, 페이지네이션 select와 동일한 스타일 컨벤션)와
 * 날짜 입력(`<input type="date">`, `yyyy-MM-dd` 브라우저 네이티브 포맷이 계약 포맷과 정확히
 * 일치하므로 별도 포맷 변환 없이 그대로 전송)을 도입한다.
 *
 * 후보 목록(members)은 현재 페이지에 이미 로드된 멤버 목록(검색/페이징된 부분집합)을 그대로 쓴다 —
 * 전체 부서원 재조회 API가 없으므로 이 범위 밖 부서장 후보는 다루지 않는다(ROADMAP T9.2 범위).
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.detail(deptId)를 invalidate(상세 재조회)한 뒤,
 * 이 컴포넌트가 성공 토스트를 띄우고 다이얼로그를 닫는다. 서버 검증 실패는 submitWithErrorMapping →
 * handleApiError(T0.2c)가 폼 루트 에러로 매핑한다.
 */
export function AppointDepartmentLeaderDialog({
  open,
  onOpenChange,
  deptId,
  members,
}: AppointDepartmentLeaderDialogProps) {
  const mutation = useAppointDepartmentLeaderMutation()
  const form = useZodForm(appointDepartmentLeaderSchema, {
    defaultValues: { leaderEmpId: '', appointedAt: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 빈 값으로 초기화한다 — 제어형 다이얼로그라 언마운트되지 않으므로 이전 세션의
  // 선택/입력값·에러가 남지 않도록 한다(RegisterDepartmentDialog와 동일 이유).
  useEffect(() => {
    if (open) {
      reset({ leaderEmpId: '', appointedAt: '' })
    }
  }, [open, reset])

  async function handleSubmit(values: AppointDepartmentLeaderFormValues) {
    await mutation.mutateAsync({
      deptId,
      leaderEmpId: Number(values.leaderEmpId),
      appointedAt: values.appointedAt,
    })
    toast.success('부서장을 지정했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(RegisterDepartmentDialog와
  // 동일 이유) — 그 사이에 다이얼로그가 닫히면 open===true에서만 도는 위 reset이 재오픈 시 root 에러까지
  // 지워버려, 뒤늦게 도착하는 지정 실패가 사용자에게 표시되지 않고 그대로 삼켜지기 때문이다.
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
          <DialogTitle>부서장 지정</DialogTitle>
          <DialogDescription>부서장으로 지정할 사원과 지정일을 선택합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leader-emp-id">
              부서장으로 지정할 사원 <span className="text-destructive">*</span>
            </Label>
            <select
              id="leader-emp-id"
              aria-invalid={!!errors.leaderEmpId}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
              {...register('leaderEmpId')}
            >
              <option value="">사원을 선택해주세요</option>
              {members.map((member) => (
                <option key={member.empId} value={member.empId}>
                  {member.empName} ({member.empNo})
                </option>
              ))}
            </select>
            {errors.leaderEmpId && (
              <p role="alert" className="text-sm text-destructive">
                {errors.leaderEmpId.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leader-appointed-at">
              지정일 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="leader-appointed-at"
              type="date"
              aria-invalid={!!errors.appointedAt}
              {...register('appointedAt')}
            />
            {errors.appointedAt && (
              <p role="alert" className="text-sm text-destructive">
                {errors.appointedAt.message}
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
              지정
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
