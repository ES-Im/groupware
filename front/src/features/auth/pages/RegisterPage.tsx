import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { register } from '../api/register'
import { AuthShell } from '../components/AuthShell'
import { RegisterForm } from '../components/RegisterForm'
import type { RegisterFormValues } from '../model/registerSchema'
import { RegistrationPendingPage } from './RegistrationPendingPage'

export function RegisterPage() {
  const [isRegistered, setIsRegistered] = useState(false)
  const registerMutation = useMutation({ mutationFn: register })

  async function handleRegister(values: RegisterFormValues) {
    await registerMutation.mutateAsync(values)
    setIsRegistered(true)
  }

  if (isRegistered) {
    return <RegistrationPendingPage />
  }

  return (
    <AuthShell
      title="회원가입"
      description="가입 후 인사과 승인이 완료되면 이용할 수 있습니다"
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            로그인
          </Link>
        </>
      }
    >
      <RegisterForm onSubmit={handleRegister} />
    </AuthShell>
  )
}
