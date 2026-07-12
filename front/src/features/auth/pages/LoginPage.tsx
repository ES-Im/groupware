import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { queryClient } from '@/shared/api/queryClient'
import { decodeJwt } from '@/shared/lib/decodeJwt'
import { employeeKeys } from '@/features/employee/model/queryKeys'
import { getMe } from '@/features/employee/api/getMe'
import { login } from '../api/login'
import { AuthShell } from '../components/AuthShell'
import { LoginForm } from '../components/LoginForm'
import type { LoginFormValues } from '../model/loginSchema'
import { useAuthStore } from '../store/authStore'

/**
 * 로그인 페이지(ROADMAP T1.2).
 *
 * 프레젠테이션 컴포넌트인 LoginForm(T1.1)에 실제 로그인 mutation을 연결하는 컨테이너.
 * - 성공: 응답의 accessToken을 authStore(인메모리, T0.4)에 저장한 뒤, useBootstrapAuth와
 *   동일하게 me를 조회하고 JWT roles를 디코드해 setUser로 status를 'authenticated'로
 *   전이시킨다. ProtectedRoute는 status==='authenticated'일 때만 자식을 렌더링하므로, 이
 *   전이 없이 navigate만 하면 즉시 /login으로 되튕긴다.
 * - 실패(AUTH_001 등): 에러를 그대로 throw해 LoginForm 내부의 submitWithErrorMapping이
 *   handleApiError(T0.2c)로 위임하도록 둔다. AUTH_001은 401이지만 코드가 ROLE_002가 아니므로
 *   axios 인터셉터(T0.1)의 reissue 대상이 아니며, handleApiError가 폼 루트 에러로 매핑한다.
 *   me 조회 실패도 세션을 신뢰할 수 없으므로 동일하게 throw되어 같은 에러 매핑 경로를 탄다.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  const loginMutation = useMutation({ mutationFn: login })

  async function handleLogin(values: LoginFormValues) {
    const { accessToken } = await loginMutation.mutateAsync(values)
    setToken(accessToken)

    const me = await queryClient.fetchQuery({
      queryKey: employeeKeys.me(),
      queryFn: getMe,
    })
    const { roles } = decodeJwt(accessToken)
    setUser(me, roles)

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
