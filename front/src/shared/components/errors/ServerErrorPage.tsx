import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface ServerErrorPageProps {
  message?: string
  variant?: 'page' | 'embedded'
  onRetry?: () => void
}

const DEFAULT_MESSAGE =
  '서버에서 예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.'

export function ServerErrorPage({ message, variant = 'page', onRetry }: ServerErrorPageProps) {
  const handleRetry = onRetry ?? (() => window.location.reload())

  return (
    <ErrorView
      variant={variant}
      code="500"
      title="서버 오류가 발생했습니다"
      description={message ?? DEFAULT_MESSAGE}
      actions={
        <Button size="lg" className="px-5" onClick={handleRetry}>
          다시 시도
        </Button>
      }
    />
  )
}
