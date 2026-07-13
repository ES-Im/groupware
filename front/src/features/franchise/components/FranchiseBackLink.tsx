import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'

/**
 * franchise 도메인 상세 화면 상단 back-link(A안 톤 레퍼런스의 crumb 이식).
 *
 * 목록/상위 화면으로 돌아가는 뒤로가기 링크를 통일된 톤으로 렌더한다. 라우팅은 react-router
 * `Link`로만 위임하고(비즈니스 로직 없음), 순수 프레젠테이셔널이다. 상세·교육 등록·교육 상세·
 * 문의 상세 화면이 공유해 한 시스템으로 보이게 한다.
 */
export function FranchiseBackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-4" />
      {children}
    </Link>
  )
}
