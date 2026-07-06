import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { register } from '../api/register'
import { AuthShell } from '../components/AuthShell'
import { RegisterForm } from '../components/RegisterForm'
import type { RegisterFormValues } from '../model/registerSchema'
import { RegistrationPendingPage } from './RegistrationPendingPage'

/**
 * 회원가입 페이지(ROADMAP T1.5).
 *
 * 프레젠테이션 컴포넌트인 RegisterForm(T1.1 패턴 재사용)에 실제 회원가입 mutation을 연결하는
 * 컨테이너. F004(EMP create)와 F013(auth 회원가입)은 동일 기능ID `REGISTER` → 단일 흐름만 구현.
 * - 성공(204, 미승인): 로컬 상태로 승인 대기 안내 화면(RegistrationPendingPage)으로 전환한다.
 *   생성된 리소스 식별자가 응답에 없으므로(Empty body) 별도 라우트 이동 대신 화면 전환으로 처리.
 * - 검증 실패(VALIDATION_ERROR/COMMON_00x 등): 에러를 그대로 throw해 RegisterForm 내부의
 *   submitWithErrorMapping이 handleApiError(T0.2c)로 위임하도록 둔다(폼 루트 에러 또는 토스트).
 * 비인증 라우트(셸 밖)이므로 ProtectedRoute로 감싸지 않는다(router.tsx).
 */
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
