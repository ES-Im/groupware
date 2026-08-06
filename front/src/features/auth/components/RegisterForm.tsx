import { Hash, IdCard, Lock, User } from 'lucide-react'
import { useZodForm, submitWithErrorMapping } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { registerSchema, type RegisterFormValues } from '../model/registerSchema'

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>
}

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
