import { Link, useNavigate } from 'react-router'
import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface ForbiddenPageProps {
  message?: string
  variant?: 'page' | 'embedded'
}

const DEFAULT_MESSAGE =
  '이 페이지에 접근하거나 요청한 작업을 수행할 권한이 없습니다. 권한이 필요하다면 관리자에게 문의해 주세요.'

export function ForbiddenPage({ message, variant = 'embedded' }: ForbiddenPageProps) {
  const navigate = useNavigate()

  return (
    <ErrorView
      variant={variant}
      code="403"
      title="접근 권한이 없습니다"
      description={message ?? DEFAULT_MESSAGE}
      actions={
        <>
          <Button size="lg" className="px-5" onClick={() => navigate(-1)}>
            이전 페이지
          </Button>
          <Button asChild variant="outline" size="lg" className="px-5">
            <Link to="/">홈으로</Link>
          </Button>
        </>
      }
    />
  )
}
