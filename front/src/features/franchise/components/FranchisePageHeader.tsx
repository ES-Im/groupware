import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * franchise 도메인 페이지 헤더(Ubold PageBreadcrumb의 제목/부제 라인 이식).
 *
 * 제목 + 보조 설명(선택)을 좌측에, 페이지 액션(등록 버튼 등)을 우측에 배치한다.
 * Ubold 우측의 "UBold > Groupware > …" 브레드크럼은 우리 셸에 브레드크럼 IA가 없어 이식하지
 * 않는다(라우팅/네비게이션 영역, 범위 밖). 순수 프레젠테이셔널이다.
 */
interface FranchisePageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function FranchisePageHeader({
  title,
  description,
  children,
  className,
}: FranchisePageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}
