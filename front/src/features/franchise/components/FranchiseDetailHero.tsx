import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * franchise 도메인 상세 헤더 hero(A안 톤 레퍼런스의 `.frhead` 이식).
 *
 * 좌측 primary 아이콘 타일 + 제목 + 상태 pill + meta(작은 아이콘 라인) + 우측 액션 버튼으로
 * 구성한다. 가맹점 상세·교육 상세 헤더가 공유해 한 시스템으로 보이게 한다. 순수 프레젠테이셔널.
 */
export function FranchiseDetailHero({
  icon,
  title,
  status,
  meta,
  actions,
  className,
}: {
  /** 좌측 타일에 넣을 lucide 아이콘 노드. */
  icon: ReactNode
  title: ReactNode
  /** 제목 오른쪽 상태 pill(선택). */
  status?: ReactNode
  /** 작은 아이콘 라인 메타(선택). 호출부가 FranchiseHeroMetaItem으로 조립해 넘긴다. */
  meta?: ReactNode
  /** 우측 액션 버튼 영역(선택). */
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start', className)}>
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-6">
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight break-words">{title}</h2>
          {status}
        </div>
        {meta && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * hero meta 한 줄(작은 아이콘 + 값). 값마다 독립 텍스트 노드로 유지한다.
 */
export function FranchiseHeroMetaItem({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:text-muted-foreground">
      {icon}
      {children}
    </span>
  )
}
