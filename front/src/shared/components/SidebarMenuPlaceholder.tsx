import type { SidebarMenuItem } from '@/shared/components/sidebarMenuItems'
import { cn } from '@/shared/lib/utils'

interface SidebarMenuPlaceholderProps {
  item: SidebarMenuItem
  collapsed: boolean
}

export function SidebarMenuPlaceholder({ item, collapsed }: SidebarMenuPlaceholderProps) {
  const Icon = item.icon

  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={collapsed ? '준비중' : undefined}
      className={cn(
        'flex w-full cursor-not-allowed items-center gap-3 rounded-md px-4 py-2 text-left',
        collapsed ? 'text-primary-foreground/40' : 'text-sidebar-foreground/40',
        collapsed && 'justify-center px-0',
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            준비중
          </span>
        </>
      )}
    </button>
  )
}
