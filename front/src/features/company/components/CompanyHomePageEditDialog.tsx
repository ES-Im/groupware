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
  /** 다이얼로그 열림 상태(제어형, CompanyInfoPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 다이얼로그가 열릴 때 입력값 초기값으로 채울 현재 조회값(CompanyInfoEditDialog와 동일 프리필 패턴). */
  currentHomePageURL: string
}

/**
 * 회사 홈페이지 URL 수정 다이얼로그(`COMPANY_UPDATE_HOME_PAGE_URL`, ROADMAP-COMPANY.md T3.2-c, F1405, ADMIN 전용).
 *
 * open이 true로 바뀔 때마다 현재 조회값으로 reset해 프리필한다(CompanyInfoEditDialog/CompanyContactEditDialog와 동일).
 *
 * homePageURL은 required 필드라 companyHomePageUpdateSchema가 이미 공백/누락을 막으므로,
 * 형제 다이얼로그(CompanyInfoEditDialog)처럼 별도 공백-only 방어는 불필요하다. 다만 스키마의
 * required 검증은 "값이 비어있지 않은지"만 볼 뿐 "프리필값과 동일한지"는 보지 않으므로, 무변경
 * 제출(현재값 그대로 재제출) 차단은 여기서 trim 비교로 직접 수행한다.
 *
 * useUpdateCompanyHomePageURLMutation은 형제 훅과 동일하게 토스트/에러 처리를 호출부에 위임하므로
 * submitWithErrorMapping을 그대로 쓴다(성공 토스트만 이 컴포넌트가 직접 띄운다).
 */
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
