import { useEffect } from 'react'
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
import { useEndDepartmentLeaderMutation } from '../api/useEndDepartmentLeaderMutation'
import {
  endDepartmentLeaderSchema,
  type EndDepartmentLeaderFormValues,
} from '../model/endDepartmentLeaderSchema'

interface EndDepartmentLeaderDialogProps {
  /** 다이얼로그 열림 상태(제어형, DepartmentDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  deptId: number
  /** 안내 문구에 표시할 현재 부서장 이름. 이 다이얼로그는 부서장이 지정된 경우에만 열리므로
   * 항상 채워진 값이 전달된다(공석이면 DepartmentDetailView가 버튼 자체를 렌더하지 않는다). */
  currentLeaderName: string
}

/**
 * 현재 부서장 종료 다이얼로그(F209, `DEPT_END_LEADER`, ROADMAP T9.3, ADMIN 전용).
 *
 * RenameDepartmentDialog/AppointDepartmentLeaderDialog와 동일한 T1.1 표준 폼 패턴
 * (useZodForm/submitWithErrorMapping, 열릴 때마다 reset, in-flight 닫힘 가드)을 재사용한다.
 * 종료일(`endAt`, `yyyy-MM-dd`) 입력 하나만 받는 단순 폼이라 별도 후보 목록 조회는 없다.
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.all을 invalidate(부서 상세 재조회)한다.
 * 종료 후 부서장 공석 판별은 재조회 시 normalizeDeptLeader(T6.1)가 자동 적용하므로 이 컴포넌트는
 * 별도 처리 없이 성공 토스트만 띄우고 다이얼로그를 닫는다.
 */
export function EndDepartmentLeaderDialog({
  open,
  onOpenChange,
  deptId,
  currentLeaderName,
}: EndDepartmentLeaderDialogProps) {
  const mutation = useEndDepartmentLeaderMutation()
  const form = useZodForm(endDepartmentLeaderSchema, {
    defaultValues: { endAt: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다 빈 값으로 초기화한다 — 제어형 다이얼로그라 언마운트되지 않으므로 이전 세션의
  // 입력값/에러가 남지 않도록 한다(RenameDepartmentDialog와 동일 이유).
  useEffect(() => {
    if (open) {
      reset({ endAt: '' })
    }
  }, [open, reset])

  async function handleSubmit(values: EndDepartmentLeaderFormValues) {
    await mutation.mutateAsync({ deptId, endAt: values.endAt })
    toast.success('부서장을 종료했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(RenameDepartmentDialog와
  // 동일 이유) — 그 사이에 다이얼로그가 닫히면 open===true에서만 도는 위 reset이 재오픈 시 root 에러까지
  // 지워버려, 뒤늦게 도착하는 종료 실패가 사용자에게 표시되지 않고 그대로 삼켜지기 때문이다.
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
          <DialogTitle>현재 부서장 종료</DialogTitle>
          <DialogDescription>
            현재 부서장({currentLeaderName})의 임기 종료일을 선택합니다.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leader-end-at">
              종료일 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="leader-end-at"
              type="date"
              aria-invalid={!!errors.endAt}
              {...register('endAt')}
            />
            {errors.endAt && (
              <p role="alert" className="text-sm text-destructive">
                {errors.endAt.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              종료
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
