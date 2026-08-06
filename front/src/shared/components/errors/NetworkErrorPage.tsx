import { WifiOff } from 'lucide-react'
import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface NetworkErrorPageProps {
  message?: string
  variant?: 'page' | 'embedded'
  onRetry?: () => void
}

const DEFAULT_MESSAGE =
  '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'

export function NetworkErrorPage({
  message,
  variant = 'page',
  onRetry,
}: NetworkErrorPageProps) {
  const handleRetry = onRetry ?? (() => window.location.reload())

  return (
    <ErrorView
      variant={variant}
      code={
        <span className="mt-2 inline-flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white">
          <WifiOff className="size-10" />
        </span>
      }
      title="네트워크에 연결할 수 없습니다"
      description={message ?? DEFAULT_MESSAGE}
      actions={
        <Button size="lg" className="px-5" onClick={handleRetry}>
          다시 시도
        </Button>
      }
    />
  )
}
