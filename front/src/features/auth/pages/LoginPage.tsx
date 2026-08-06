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
