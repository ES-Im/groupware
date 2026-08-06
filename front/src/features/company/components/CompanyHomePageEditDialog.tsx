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
import { useUpdateCompanyHomePageURLMutation } from '../api/useUpdateCompanyHomePageURLMutation'
import {
  companyHomePageUpdateSchema,
  type CompanyHomePageUpdateFormValues,
} from '../model/companyHomePageUpdateSchema'

interface CompanyHomePageEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentHomePageURL: string
}

export function CompanyHomePageEditDialog({
  open,
  onOpenChange,
  currentHomePageURL,
}: CompanyHomePageEditDialogProps) {
  const mutation = useUpdateCompanyHomePageURLMutation()
  const form = useZodForm(companyHomePageUpdateSchema, {
    defaultValues: {
      homePageURL: currentHomePageURL,
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
      reset({ homePageURL: currentHomePageURL })
    }
  }, [open, currentHomePageURL, reset])

  async function onSubmit(values: CompanyHomePageUpdateFormValues) {
    clearErrors('root')

    if (values.homePageURL.trim() === currentHomePageURL.trim()) {
      setError('root', { message: '변경할 값을 입력해주세요' })
      return
    }

    await mutation.mutateAsync(values)
    toast.success('회사 홈페이지 URL을 수정했습니다')
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
          <DialogTitle>홈페이지 URL 수정</DialogTitle>
          <DialogDescription>회사 홈페이지 URL을 수정합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-home-page-url">홈페이지 URL</Label>
            <Input
              id="company-home-page-url"
              placeholder="https://example.com"
              maxLength={200}
              aria-invalid={!!errors.homePageURL}
              {...register('homePageURL')}
            />
            {errors.homePageURL && (
              <p role="alert" className="text-sm text-destructive">
                {errors.homePageURL.message}
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
