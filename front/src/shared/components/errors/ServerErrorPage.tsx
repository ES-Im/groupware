import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface ServerErrorPageProps {
  /** 백엔드 ApiError.message를 그대로 노출하고 싶을 때. 없으면 기본 문구 사용 */
  message?: string
  /** 부모가 배치 맥락에 맞게 덮어쓸 수 있도록 */
  variant?: 'page' | 'embedded'
  /** 미지정 시 전체 새로고침을 기본 동작으로 쓴다. */
  onRetry?: () => void
}

const DEFAULT_MESSAGE =
  '서버에서 예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.'

/**
 * 500 화면. 셸 자체가 렌더에 실패했을 수 있는 상황(전역 에러 바운더리)까지 포괄해야 하므로
 * 셸에 의존하지 않는 page가 기본이다.
 */
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
