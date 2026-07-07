import { Hash, IdCard, Lock, User } from 'lucide-react'
import { useZodForm, submitWithErrorMapping } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { registerSchema, type RegisterFormValues } from '../model/registerSchema'

interface RegisterFormProps {
  /**
   * 클라 사전검증을 통과한 값으로 실제 회원가입 요청을 수행한다.
   * 성공 이후 동작(승인 대기 화면 전환)은 이 폼의 책임이 아니다(RegisterPage가 조합).
   * 서버가 던진 에러는 그대로 reject하면 submitWithErrorMapping이 handleApiError로
   * 위임해 폼 루트 에러/토스트로 매핑한다.
   */
  onSubmit: (values: RegisterFormValues) => Promise<void>
}

/**
 * RHF + zod 표준 폼 패턴 재사용(ROADMAP T1.1 → T1.5).
 * 1) zodResolver로 empNo/name/loginId/password를 클라에서 선검증(registerSchema).
 * 2) 제출 시 서버가 던진 에러(VALIDATION_ERROR/COMMON_00x 등 중복 empNo·loginId 포함)는
 *    submitWithErrorMapping → handleApiError가 폼 루트(root) 에러 또는 토스트로 매핑한다
 *    (계약상 message는 필드 하나만 알려주므로 필드별 다중 매핑은 하지 않는다. LoginForm과 동일 패턴).
 */
export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const form = useZodForm(registerSchema, {
    defaultValues: { empNo: '', name: '', loginId: '', password: '' },
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
        <Label htmlFor="empNo">
          사원번호 <span className="text-destructive">*</span>
        </Label>
        {/* 로그인 화면과 동일한 아이콘 입력 패턴(절대 위치 아이콘 + pl-9, h-11)으로 통일한다. */}
        <div className="relative">
          <Hash className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="empNo"
            className="h-11 pl-9"
            aria-invalid={!!errors.empNo}
            {...register('empNo')}
          />
        </div>
        {errors.empNo && (
          <p role="alert" className="text-sm text-destructive">
            {errors.empNo.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">
          이름 <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            autoComplete="name"
            className="h-11 pl-9"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
        </div>
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loginId">
          아이디 <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <IdCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="loginId"
            autoComplete="username"
            className="h-11 pl-9"
            aria-invalid={!!errors.loginId}
            {...register('loginId')}
          />
        </div>
        {errors.loginId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.loginId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">
          비밀번호 <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="h-11 pl-9"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </div>
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
        회원가입
      </Button>
    </form>
  )
}
