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
import { useRegisterDepartmentMutation } from '../api/useRegisterDepartmentMutation'
import {
  registerDepartmentSchema,
  type RegisterDepartmentFormValues,
} from '../model/registerDepartmentSchema'

interface RegisterDepartmentDialogProps {
  /** 다이얼로그 열림 상태(제어형, DepartmentsPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 부서 등록 다이얼로그(`DEPT_REGISTER`, ROADMAP T8.1, ADMIN 전용).
 *
 * T1.1의 useZodForm/submitWithErrorMapping 표준 폼 패턴(UpdateMeForm/LoginForm과 동형 구조)을
 * 이 저장소 최초의 shadcn Dialog 컨텍스트에 이식한다. 클라 사전검증(registerDepartmentSchema)을
 * 통과한 값만 useRegisterDepartmentMutation으로 전송하고, 서버가 던진 에러(VALIDATION_ERROR/
 * COMMON_00x 등)는 submitWithErrorMapping → handleApiError(T0.2c)가 폼 루트(root) 에러 또는
 * 토스트로 매핑한다(계약상 message는 필드 하나만 알려주므로 필드별 다중 매핑은 하지 않는다).
 *
 * 성공(204) 시: mutation의 onSuccess가 departmentKeys.all을 invalidate(목록 재조회)한 뒤,
 * 이 컴포넌트가 성공 토스트를 띄우고 다이얼로그를 닫는다. 닫힐 때마다 폼을 리셋해 다음에 열 때
 * 이전 입력값/에러가 남지 않도록 한다(제어형 다이얼로그라 언마운트되지 않으므로 명시적 리셋 필요).
 */
export function RegisterDepartmentDialog({ open, onOpenChange }: RegisterDepartmentDialogProps) {
  const mutation = useRegisterDepartmentMutation()
  const form = useZodForm(registerDepartmentSchema, {
    defaultValues: { deptCode: '', deptName: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  async function handleSubmit(values: RegisterDepartmentFormValues) {
    await mutation.mutateAsync(values)
    toast.success('부서를 등록했습니다')
    onOpenChange(false)
  }

  // 제출 중(mutation in-flight)에는 Esc·오버레이 클릭·닫기 버튼 전부를 무시한다 — 그 사이에 다이얼로그가
  // 닫히면 폼이 reset()되어, 뒤늦게 도착하는 등록 실패가 사용자에게 표시되지 않고 그대로 삼켜지기 때문이다.
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
          <DialogTitle>부서 등록</DialogTitle>
          <DialogDescription>새 부서의 코드와 이름을 입력해 등록합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-code">
              부서 코드 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dept-code"
              placeholder="000"
              aria-invalid={!!errors.deptCode}
              {...register('deptCode')}
            />
            {errors.deptCode && (
              <p role="alert" className="text-sm text-destructive">
                {errors.deptCode.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name">
              부서명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dept-name"
              placeholder="부서명"
              aria-invalid={!!errors.deptName}
              {...register('deptName')}
            />
            {errors.deptName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.deptName.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
