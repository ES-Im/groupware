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
import { useUpdateDepartmentNameMutation } from '../api/useUpdateDepartmentNameMutation'
import {
  updateDepartmentNameSchema,
  type UpdateDepartmentNameFormValues,
} from '../model/updateDepartmentNameSchema'

interface RenameDepartmentDialogProps {
  /** 다이얼로그 열림 상태(제어형, DepartmentDetailPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  deptId: number
  /** 다이얼로그가 열릴 때 입력값 초기값으로 채울 현재 부서명. */
  currentName: string
}

/**
 * 부서명 변경 다이얼로그(F206, `DEPT_UPDATE_NAME`, ROADMAP T9.2, ADMIN 전용).
 *
 * RegisterDepartmentDialog(T8.1)와 동일한 T1.1 useZodForm/submitWithErrorMapping 표준 패턴을
 * 재사용한다. 등록 다이얼로그와 달리 이 다이얼로그는 현재 부서명을 미리 채워 보여줘야 하므로,
 * open이 true로 바뀔 때마다(닫힌 뒤 다시 열 때 포함) currentName으로 reset한다.
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.detail(deptId)를 invalidate(상세 재조회)한 뒤,
 * 이 컴포넌트가 성공 토스트를 띄우고 다이얼로그를 닫는다. 서버 검증 실패(VALIDATION_ERROR/COMMON_00x)는
 * submitWithErrorMapping → handleApiError(T0.2c)가 폼 루트 에러로 매핑한다.
 */
export function RenameDepartmentDialog({
  open,
  onOpenChange,
  deptId,
  currentName,
}: RenameDepartmentDialogProps) {
  const mutation = useUpdateDepartmentNameMutation()
  const form = useZodForm(updateDepartmentNameSchema, {
    defaultValues: { newName: currentName },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // 열릴 때마다(재오픈 포함) 현재 부서명으로 초기화한다 — 제어형 다이얼로그라 언마운트되지 않으므로
  // 이전 세션의 입력값/에러가 남지 않도록 명시적으로 reset한다(RegisterDepartmentDialog와 동일 이유).
  useEffect(() => {
    if (open) {
      reset({ newName: currentName })
    }
  }, [open, currentName, reset])

  async function handleSubmit(values: UpdateDepartmentNameFormValues) {
    await mutation.mutateAsync({ deptId, newName: values.newName })
    toast.success('부서명을 변경했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다(RegisterDepartmentDialog와
  // 동일 이유) — 그 사이에 다이얼로그가 닫히면 open===true에서만 도는 위 reset이 재오픈 시 root 에러까지
  // 지워버려, 뒤늦게 도착하는 변경 실패가 사용자에게 표시되지 않고 그대로 삼켜지기 때문이다.
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
          <DialogTitle>부서명 변경</DialogTitle>
          <DialogDescription>새 부서명을 입력해 변경합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-new-name">
              부서명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dept-new-name"
              placeholder="부서명"
              aria-invalid={!!errors.newName}
              {...register('newName')}
            />
            {errors.newName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.newName.message}
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
              변경
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
