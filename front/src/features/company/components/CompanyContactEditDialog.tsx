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
  /** 다이얼로그 열림 상태(제어형, CompanyInfoPage가 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 다이얼로그가 열릴 때 입력값 초기값으로 채울 현재 조회값(CompanyInfoEditDialog와 동일 프리필 패턴). */
  currentPresentedEmail: string
  currentPresentedExternalNo: string
}

/**
 * 회사 대표 연락처 수정 다이얼로그(`COMPANY_UPDATE_CONTACT`, ROADMAP-COMPANY.md T3.2-b, F1404, ADMIN 전용).
 *
 * open이 true로 바뀔 때마다 현재 조회값으로 reset해 프리필한다(CompanyInfoEditDialog와 동일).
 *
 * companyContactUpdateSchema의 object-level refine은 "값이 하나라도 비어있지 않은지"만 검사하므로,
 * 현재값을 프리필하는 이 흐름에서는(등록된 값은 항상 비어있지 않음) 무변경 제출도 refine을 그대로
 * 통과해버린다. 그래서 CompanyInfoEditDialog와 동일하게 refine과 별개로 제출값을 원본 조회값과
 * trim 비교해 완전히 동일하면 폼 루트 에러로 막는다.
 *
 * useUpdateCompanyContactMutation은 토스트/에러 처리를 호출부에 위임하므로 submitWithErrorMapping을
 * 그대로 쓴다(성공 토스트만 이 컴포넌트가 직접 띄운다).
 */
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

    // updateCompanyContact는 falsy(빈 문자열) 필드를 요청 바디에서 제외한다(서버는 필드를
    // 아예 안 보내야 "변경 없음"으로 해석 — Company.java의 null 기반 부분수정 의미론과 정합).
    // 그래서 "빈 값으로 지우기"는 실질적으로 아무 효과가 없는 제출이라, trim 결과가 빈 문자열인
    // 필드는 "값이 있고 원본과 달라야" 실제 변경으로 센다(단순 trim 불일치만으로는 안 됨) —
    // 그래야 무변경-오탐(값은 그대로인데 성공 토스트만 뜨는 문제) 없이 정확히 차단된다.
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
