import { Link } from 'react-router'

/**
 * 승인 대기 안내 화면(ROADMAP T1.5).
 *
 * 회원가입(REGISTER) 성공 직후(204) 노출되는 프레젠테이션 컴포넌트.
 * 안내 문구 근거: ../docs/도메인모델.md §Emp_Status·§Emp 규칙4
 * - 신규 가입 사원은 `PENDING`(승인보류) 상태로 생성되며, `PENDING` → `ACTIVE`는 인사과 가입
 *   승인 시에만 전이된다.
 * - 개인정보 수정·파일 변경·소속 변경 등은 `ACTIVE` 상태에서만 가능하다.
 * - 로그인 자체도 서버가 `status = ACTIVE`인 계정만 조회하므로(EmpDetailsService) 승인 전에는
 *   로그인할 수 없다.
 */
export function RegistrationPendingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-xl font-semibold">가입 신청이 접수되었습니다</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        입력하신 정보는 인사과 승인 대기(PENDING) 상태로 등록되었습니다. 인사과 승인이 완료되어
        재직중(ACTIVE) 상태로 전환되기 전까지는 로그인 및 개인정보 수정 등 서비스 이용이
        제한됩니다. 승인 완료 후 다시 로그인해주세요.
      </p>
      <Link to="/login" className="text-sm underline underline-offset-4">
        로그인으로
      </Link>
    </div>
  )
}
