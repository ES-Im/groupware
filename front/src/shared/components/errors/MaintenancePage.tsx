import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface MaintenancePageProps {
  message?: string
  variant?: 'page' | 'embedded'
  until?: string
}

const DEFAULT_MESSAGE =
  '서비스 점검이 진행 중입니다. 점검이 끝나는 대로 정상적으로 이용하실 수 있습니다.'

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
