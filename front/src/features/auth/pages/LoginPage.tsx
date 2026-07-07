import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { login } from '../api/login'
import { AuthShell } from '../components/AuthShell'
import { LoginForm } from '../components/LoginForm'
import type { LoginFormValues } from '../model/loginSchema'
import { useAuthStore } from '../store/authStore'

/**
 * 로그인 페이지(ROADMAP T1.2).
 *
 * 프레젠테이션 컴포넌트인 LoginForm(T1.1)에 실제 로그인 mutation을 연결하는 컨테이너.
 * - 성공: 응답의 accessToken을 authStore(인메모리, T0.4)에 저장하고 홈(`/`)으로 이동한다.
 *   (사용자 정보/roles로 status를 'authenticated'로 전이시키는 것은 T1.4/T1.6에서 배선한다.
 *   LOGIN 응답에는 accessToken만 내려오므로 이 태스크에서 setUser를 임의로 호출하지 않는다.)
 * - 실패(AUTH_001 등): 에러를 그대로 throw해 LoginForm 내부의 submitWithErrorMapping이
 *   handleApiError(T0.2c)로 위임하도록 둔다. AUTH_001은 401이지만 코드가 ROLE_002가 아니므로
 *   axios 인터셉터(T0.1)의 reissue 대상이 아니며, handleApiError가 폼 루트 에러로 매핑한다.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const loginMutation = useMutation({ mutationFn: login })

  async function handleLogin(values: LoginFormValues) {
    const { accessToken } = await loginMutation.mutateAsync(values)
    setToken(accessToken)
    navigate('/', { replace: true })
  }

  return (
    <AuthShell
      title="LOGIN"
      description="HARUON 그룹웨어 계정으로 로그인하세요"
      footer={
        <>
          계정이 없으신가요?{' '}
          <Link
            to="/register"
            className="font-medium text-foreground underline underline-offset-4"
          >
            회원가입
          </Link>
        </>
      }
    >
      <LoginForm onSubmit={handleLogin} />
    </AuthShell>
  )
}
