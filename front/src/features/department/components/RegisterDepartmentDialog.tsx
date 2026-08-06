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
import { useRegisterDepartmentMutation } from '../api/useRegisterDepartmentMutation'
import {
  registerDepartmentSchema,
  type RegisterDepartmentFormValues,
} from '../model/registerDepartmentSchema'

interface RegisterDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
