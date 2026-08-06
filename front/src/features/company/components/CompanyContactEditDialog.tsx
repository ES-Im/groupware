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
import { useUpdateCompanyContactMutation } from '../api/useUpdateCompanyContactMutation'
import {
  companyContactUpdateSchema,
  type CompanyContactUpdateFormValues,
} from '../model/companyContactUpdateSchema'

interface CompanyContactEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPresentedEmail: string
  currentPresentedExternalNo: string
}

export function CompanyContactEditDialog({
  open,
  onOpenChange,
  currentPresentedEmail,
  currentPresentedExternalNo,
}: CompanyContactEditDialogProps) {
  const mutation = useUpdateCompanyContactMutation()
  const form = useZodForm(companyContactUpdateSchema, {
    defaultValues: {
      presentedEmail: currentPresentedEmail,
      presentedExternalNo: currentPresentedExternalNo,
    },
  })

  const {
    register,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({
        presentedEmail: currentPresentedEmail,
        presentedExternalNo: currentPresentedExternalNo,
      })
    }
  }, [open, currentPresentedEmail, currentPresentedExternalNo, reset])

  async function onSubmit(values: CompanyContactUpdateFormValues) {
    clearErrors('root')

    const isEmailChanged =
      (values.presentedEmail ?? '').trim() !== '' &&
      values.presentedEmail?.trim() !== currentPresentedEmail.trim()
    const isExternalNoChanged =
      (values.presentedExternalNo ?? '').trim() !== '' &&
      values.presentedExternalNo?.trim() !== currentPresentedExternalNo.trim()
    if (!isEmailChanged && !isExternalNoChanged) {
      setError('root', { message: '변경할 값을 하나 이상 입력해주세요' })
      return
    }

    await mutation.mutateAsync(values)
    toast.success('회사 연락처를 수정했습니다')
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
          <DialogTitle>연락처 수정</DialogTitle>
          <DialogDescription>대표 이메일·대표 연락처를 수정합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-contact-email">대표 이메일</Label>
            <Input
              id="company-contact-email"
              type="email"
              placeholder="company@example.com"
              maxLength={150}
              aria-invalid={!!errors.presentedEmail}
              {...register('presentedEmail')}
            />
            {errors.presentedEmail && (
              <p role="alert" className="text-sm text-destructive">
                {errors.presentedEmail.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-contact-external-no">대표 연락처</Label>
            <Input
              id="company-contact-external-no"
              placeholder="02-1234-5678"
              maxLength={20}
              aria-invalid={!!errors.presentedExternalNo}
              {...register('presentedExternalNo')}
            />
            {errors.presentedExternalNo && (
              <p role="alert" className="text-sm text-destructive">
                {errors.presentedExternalNo.message}
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
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
