import type { ReactNode } from 'react'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

/**
 * 홈 대시보드 공통 KPI 카드(레퍼런스 dashboard-roles.html `.kpi` 앤아토미 이식).
 *
 * 아이콘 타일(좌상단) + 라벨 + 큰 수치(+단위) + 보조설명 구조. 레퍼런스의 트렌드 델타(+2/-2)는
 * 뒷받침할 실데이터가 없어 재현하지 않는다(계약에 없는 정보 발명 금지 — 팀 정책). 색은 프로젝트
 * 정책상 shadcn 기본 무채색 토큰만 쓰며, 강조는 아이콘 타일 톤(primary/muted/destructive)으로만
 * 표현한다. franchise 도메인 공유 컴포넌트(FranchiseMetricCard)와 별개인 home 전용 카드다.
 *
 * 순수 프레젠테이셔널: 수치·라벨은 상위(DashboardKpiRow)가 실데이터에서 계산해 props로 주입한다.
 */
export type DashboardKpiAccent = 'primary' | 'muted' | 'destructive'

interface DashboardKpiCardProps {
  label: string
  /** 큰 수치 본문(단위 제외). */
  value: number | string
  /** 수치 뒤 작은 단위 접미사(예: "건"). */
  unit?: string
  /** 수치 아래 보조 설명(muted). 없으면 렌더하지 않는다. */
  sub?: string
  /** 좌상단 아이콘 타일에 넣을 lucide 노드. */
  icon?: ReactNode
  accent?: DashboardKpiAccent
}

/** 아이콘 타일 톤. 보유 토큰(muted/foreground/destructive)만 사용한다. */
const ICON_TONE: Record<DashboardKpiAccent, string> = {
  primary: 'bg-muted text-foreground',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive',
}

export function DashboardKpiCard({
  label,
  value,
  unit,
  sub,
  icon,
  accent = 'primary',
}: DashboardKpiCardProps) {
  return (
    <Card className="h-full">
      {icon && (
        <div className="px-(--card-spacing)">
          <span
            className={cn(
              'grid size-10 place-items-center rounded-xl [&_svg]:size-5',
              ICON_TONE[accent],
            )}
          >
            {icon}
          </span>
        </div>
      )}
      <div className="px-(--card-spacing)">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl leading-none font-bold tracking-tight tabular-nums">
          {value}
          {unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
        </p>
        {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  )
}
