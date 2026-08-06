import type { ReactNode } from 'react'

interface RoleBandHeaderProps {
  icon: ReactNode
  title: string
  roleChip: string
}

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
