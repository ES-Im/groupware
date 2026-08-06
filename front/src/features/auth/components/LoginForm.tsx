import { Lock, User } from 'lucide-react'
import { useZodForm, submitWithErrorMapping } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { loginSchema, type LoginFormValues } from '../model/loginSchema'

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>
}

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
        <Label htmlFor="loginId">
          ID <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="loginId"
            className="h-11 pl-9"
            placeholder="your ID"
            autoComplete="username"
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
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            className="h-11 pl-9"
            placeholder="••••••••"
            autoComplete="current-password"
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
        로그인
      </Button>
    </form>
  )
}
