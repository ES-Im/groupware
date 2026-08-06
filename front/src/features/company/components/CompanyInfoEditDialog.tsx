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
import { useUpdateCompanyInfoMutation } from '../api/useUpdateCompanyInfoMutation'
import {
  companyInfoUpdateSchema,
  type CompanyInfoUpdateFormValues,
} from '../model/companyInfoUpdateSchema'

interface CompanyInfoEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCompanyName: string
  currentLocation: string
  currentOwnerName: string
}

export function CompanyInfoEditDialog({
  open,
  onOpenChange,
  currentCompanyName,
  currentLocation,
  currentOwnerName,
}: CompanyInfoEditDialogProps) {
  const mutation = useUpdateCompanyInfoMutation()
  const form = useZodForm(companyInfoUpdateSchema, {
    defaultValues: {
      companyName: currentCompanyName,
      location: currentLocation,
      ownerName: currentOwnerName,
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
        companyName: currentCompanyName,
        location: currentLocation,
        ownerName: currentOwnerName,
      })
    }
  }, [open, currentCompanyName, currentLocation, currentOwnerName, reset])

  async function onSubmit(values: CompanyInfoUpdateFormValues) {
    clearErrors('root')

    const isNameChanged =
      (values.companyName ?? '').trim() !== '' &&
      values.companyName?.trim() !== currentCompanyName.trim()
    const isLocationChanged =
      (values.location ?? '').trim() !== '' && values.location?.trim() !== currentLocation.trim()
    const isOwnerNameChanged =
      (values.ownerName ?? '').trim() !== '' &&
      values.ownerName?.trim() !== currentOwnerName.trim()
    if (!isNameChanged && !isLocationChanged && !isOwnerNameChanged) {
      setError('root', { message: '변경할 값을 하나 이상 입력해주세요' })
      return
    }

    await mutation.mutateAsync(values)
    toast.success('회사 기본정보를 수정했습니다')
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
          <DialogTitle>기본정보 수정</DialogTitle>
          <DialogDescription>회사명·위치·대표자명을 수정합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-info-name">회사명</Label>
            <Input
              id="company-info-name"
              placeholder="회사명을 입력해주세요"
              maxLength={50}
              aria-invalid={!!errors.companyName}
              {...register('companyName')}
            />
            {errors.companyName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-info-location">위치</Label>
            <Input
              id="company-info-location"
              placeholder="회사 위치를 입력해주세요"
              maxLength={200}
              aria-invalid={!!errors.location}
              {...register('location')}
            />
            {errors.location && (
              <p role="alert" className="text-sm text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-info-owner-name">대표자명</Label>
            <Input
              id="company-info-owner-name"
              placeholder="대표자명을 입력해주세요"
              maxLength={20}
              aria-invalid={!!errors.ownerName}
              {...register('ownerName')}
            />
            {errors.ownerName && (
              <p role="alert" className="text-sm text-destructive">
                {errors.ownerName.message}
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
