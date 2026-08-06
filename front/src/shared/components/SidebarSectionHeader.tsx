import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/utils'

interface SidebarSectionHeaderProps {
  title: string
  collapsed: boolean
}

export function SidebarSectionHeader({ title, collapsed }: SidebarSectionHeaderProps) {
  if (collapsed) {
    return (
      <div className="my-2 px-3" aria-hidden="true">
        <Separator />
      </div>
    )
  }

  return (
    <div className={cn('mt-4 mb-1.5 flex items-center gap-2 px-4 first:mt-0')}>
      <span className="shrink-0 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </span>
      <Separator className="flex-1" />
    </div>
  )
}
