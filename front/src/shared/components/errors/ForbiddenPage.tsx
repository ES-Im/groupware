import { Link, useNavigate } from 'react-router'
import { ErrorView } from '@/shared/components/ErrorView'
import { Button } from '@/shared/ui/button'

interface ForbiddenPageProps {
  /**
   * 백엔드 ApiError.message를 그대로 노출하고 싶을 때. 없으면 기본 문구 사용.
   * 403은 ROLE_003("부서 관리자는 같은 부서의 사원만 수정할 수 있습니다")처럼 구체적인
   * 한국어 사유가 함께 오므로, 주어졌다면 일반 문구보다 그쪽이 사용자에게 훨씬 유용하다.
   */
  message?: string
  /** 부모가 배치 맥락에 맞게 덮어쓸 수 있도록 */
  variant?: 'page' | 'embedded'
}

const DEFAULT_MESSAGE =
  '이 페이지에 접근하거나 요청한 작업을 수행할 권한이 없습니다. 권한이 필요하다면 관리자에게 문의해 주세요.'

/**
 * 403 화면(레퍼런스 디자인의 기준 화면). 권한 부족은 로그인 상태에서 발생하므로 셸을 유지하는
 * embedded가 기본이며, 주 동작은 직전 화면으로 되돌아가는 것이다.
 */
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
