import type { ReactNode } from 'react'

interface RoleBandHeaderProps {
  icon: ReactNode
  title: string
  roleChip: string
}

/**
 * 역할 밴드(HR/FACILITY/FRANCHISE) 공용 헤더(레퍼런스 dashboard-roles.html `.band` 섹션 이식).
 * 아이콘 + 타이틀 + 역할칩 + 구분선으로 구성해 공통 위젯 영역과 역할별 영역을 시각적으로 분리한다.
 */
export function RoleBandHeader({ icon, title, roleChip }: RoleBandHeaderProps) {
  return (
    <div className="mt-2 mb-1 flex items-center gap-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
        {roleChip}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
