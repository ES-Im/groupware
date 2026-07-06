import { useZodForm, submitWithErrorMapping } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { loginSchema, type LoginFormValues } from '../model/loginSchema'

interface LoginFormProps {
  /**
   * 클라 사전검증을 통과한 값으로 실제 로그인 요청을 수행한다.
   * 성공/실패 이후 동작(토큰 저장·홈 이동 등)은 이 폼의 책임이 아니다(T1.2에서 로그인
   * 페이지가 조합). 서버가 던진 에러는 그대로 reject하면 submitWithErrorMapping이
   * handleApiError로 위임해 폼 루트 에러/토스트로 매핑한다.
   */
  onSubmit: (values: LoginFormValues) => Promise<void>
}

/**
 * RHF + zod 표준 폼 패턴의 최초 소비처(ROADMAP T1.1).
 * 1) zodResolver로 loginId/password 필수 입력을 클라에서 선검증.
 * 2) 제출 시 서버가 던진 에러(VALIDATION_ERROR/COMMON_00x/AUTH_001 등)는
 *    submitWithErrorMapping → handleApiError가 폼 루트(root) 에러 또는 토스트로 매핑한다
 *    (계약상 message는 필드 하나만 알려주므로 필드별 다중 매핑은 하지 않는다).
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  const form = useZodForm(loginSchema, {
    defaultValues: { loginId: '', password: '' },
  })

  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loginId">아이디</Label>
        <Input
          id="loginId"
          autoComplete="username"
          aria-invalid={!!errors.loginId}
          {...register('loginId')}
        />
        {errors.loginId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.loginId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        로그인
      </Button>
    </form>
  )
}
