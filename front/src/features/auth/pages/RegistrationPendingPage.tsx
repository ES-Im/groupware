import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { AuthShell } from '../components/AuthShell'

export function RegistrationPendingPage() {
  return (
    <AuthShell
      title="가입 신청이 접수되었습니다"
      footer={
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          로그인으로
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed text-muted-foreground">
          입력하신 정보는 인사과 승인 대기(PENDING) 상태로 등록되었습니다. 인사과 승인이 완료되어
          재직중(ACTIVE) 상태로 전환되기 전까지는 로그인 및 개인정보 수정 등 서비스 이용이
          제한됩니다. 승인 완료 후 다시 로그인해주세요.
        </p>
      </div>
    </AuthShell>
  )
}
