import { WifiOff } from 'lucide-react'
import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface NetworkErrorPageProps {
  /** 백엔드 ApiError.message를 그대로 노출하고 싶을 때. 없으면 기본 문구 사용 */
  message?: string
  /** 부모가 배치 맥락에 맞게 덮어쓸 수 있도록 */
  variant?: 'page' | 'embedded'
  /** 미지정 시 전체 새로고침을 기본 동작으로 쓴다. */
  onRetry?: () => void
}

const DEFAULT_MESSAGE =
  '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'

/**
 * 네트워크 단절 화면. 상태코드가 없는 유일한 화면이라 초대형 영역에 숫자 대신 아이콘을 둔다.
 * ErrorView는 텍스트 코드에만 그라데이션 텍스트를 적용하므로, 아이콘의 그라데이션 배경은
 * 이 화면이 직접 스타일링해 레퍼런스의 색감(바이올렛→핑크)을 맞춘다.
 */
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
