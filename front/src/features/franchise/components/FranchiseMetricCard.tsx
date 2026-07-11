import type { ReactNode } from 'react'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

/**
 * franchise 도메인 KPI 지표 카드(Ubold SummaryMetricCard 이식).
 *
 * 상단 액센트 바 + 제목 pill + 큰 수치 + 보조 설명 + 원형 아이콘 아바타로 구성한다.
 * 색은 프로젝트 정책(shadcn 기본 토큰만, 커스텀 팔레트 없음 — LayoutShell 주석)을 지켜
 * primary/muted/destructive 세 톤으로만 표현한다(Ubold의 success/warning/info 다색은
 * 토큰 부재로 미도입 — 팔레트 확장 시 accent 매핑만 교체하면 된다).
 *
 * 순수 프레젠테이셔널: 표시할 수치·라벨은 상위 페이지가 실데이터에서 계산해 props로 주입한다.
 */
export type FranchiseMetricAccent = 'primary' | 'muted' | 'destructive'

interface FranchiseMetricCardProps {
  title: string
  value: string
  description?: string
  /** 우측 원형 아이콘 아바타(lucide 노드). 생략하면 아바타 없이 수치만 렌더한다. */
  icon?: ReactNode
  accent?: FranchiseMetricAccent
  className?: string
}

/** 상단 액센트 바 색. 보유 토큰(primary/border/destructive)만 사용한다. */
const ACCENT_BAR: Record<FranchiseMetricAccent, string> = {
  primary: 'bg-primary',
  muted: 'bg-border',
  destructive: 'bg-destructive/60',
}

/** 아이콘 아바타 톤. 액센트와 짝을 맞춰 시각적 일관성을 유지한다. */
const ICON_TONE: Record<FranchiseMetricAccent, string> = {
  primary: 'bg-muted text-foreground',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive',
}

export function FranchiseMetricCard({
  title,
  value,
  description,
  icon,
  accent = 'primary',
  className,
}: FranchiseMetricCardProps) {
  return (
    <Card className={cn('relative h-full pt-5', className)}>
      {/* 상단 액센트 바(카드 overflow-hidden 안에 붙어 모서리 라운드를 따른다). */}
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', ACCENT_BAR[accent])} />
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <div className="min-w-0">
          <span className="inline-flex w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <p className="mt-3 truncate text-2xl leading-tight font-semibold tabular-nums">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5',
              ICON_TONE[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  )
}
