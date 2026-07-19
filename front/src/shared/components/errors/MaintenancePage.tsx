import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface MaintenancePageProps {
  /** 백엔드 ApiError.message를 그대로 노출하고 싶을 때. 없으면 기본 문구 사용 */
  message?: string
  /** 부모가 배치 맥락에 맞게 덮어쓸 수 있도록 */
  variant?: 'page' | 'embedded'
  /** 점검 종료 예정 안내 문구(예: '2026-07-20 06:00'). 주어졌을 때만 별도 줄로 노출한다. */
  until?: string
}

const DEFAULT_MESSAGE =
  '서비스 점검이 진행 중입니다. 점검이 끝나는 대로 정상적으로 이용하실 수 있습니다.'

/**
 * 503 점검 안내 화면. 점검 중에는 셸이 의존하는 API도 함께 내려가 있을 수 있으므로 page가 기본이다.
 */
export function MaintenancePage({ message, variant = 'page', until }: MaintenancePageProps) {
  return (
    <ErrorView
      variant={variant}
      code="503"
      title="서비스 점검 중입니다"
      description={
        <>
          <p>{message ?? DEFAULT_MESSAGE}</p>
          {until && <p className="mt-2 font-medium text-foreground">점검 종료 예정 {until}</p>}
        </>
      }
      actions={
        <Button size="lg" className="px-5" onClick={() => window.location.reload()}>
          새로고침
        </Button>
      }
    />
  )
}
