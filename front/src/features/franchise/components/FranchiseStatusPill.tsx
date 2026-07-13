import type { ReactNode } from 'react'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'

/**
 * franchise 도메인 상태 pill(A안 톤 레퍼런스의 dot 앞머리 pill 이식).
 *
 * shadcn Badge를 감싸 앞에 상태색 dot을 찍은 pill로 통일한다(레퍼런스 `.pill::before`). 색은
 * 프로젝트 정책(shadcn 기본 토큰만, 커스텀 팔레트 없음 — LayoutShell 주석)을 지켜 Badge 변형
 * (default/secondary/outline/destructive)으로만 표현하고, dot은 `bg-current`로 텍스트색을 그대로
 * 따라 변형별 대비를 유지한다. 순수 프레젠테이셔널: 어떤 상태를 어느 변형에 매핑할지는 호출부가
 * 정한다(코드 발명 없음).
 */
type FranchisePillVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export function FranchiseStatusPill({
  variant = 'secondary',
  children,
  className,
}: {
  variant?: FranchisePillVariant
  children: ReactNode
  className?: string
}) {
  return (
    <Badge variant={variant} className={cn('gap-1.5', className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </Badge>
  )
}
