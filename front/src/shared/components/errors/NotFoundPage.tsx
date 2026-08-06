import { Link, useNavigate } from 'react-router'
import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface NotFoundPageProps {
  message?: string
  variant?: 'page' | 'embedded'
}

const DEFAULT_MESSAGE =
  '요청하신 페이지를 찾을 수 없습니다. 주소가 변경되었거나 삭제된 페이지일 수 있습니다.'

export function NotFoundPage({ message, variant = 'embedded' }: NotFoundPageProps) {
  const navigate = useNavigate()

  return (
    <ErrorView
      variant={variant}
      code="404"
      title="페이지를 찾을 수 없습니다"
      description={message ?? DEFAULT_MESSAGE}
      actions={
        <>
          <Button asChild size="lg" className="px-5">
            <Link to="/">홈으로</Link>
          </Button>
          <Button variant="outline" size="lg" className="px-5" onClick={() => navigate(-1)}>
            이전 페이지
          </Button>
        </>
      }
    />
  )
}
