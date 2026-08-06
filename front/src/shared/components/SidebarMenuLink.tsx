import { NavLink } from 'react-router'
import type { SidebarMenuItem } from '@/shared/components/sidebarMenuItems'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

interface SidebarMenuLinkProps {
  item: SidebarMenuItem
  collapsed: boolean
  badgeCounts?: Record<string, number | undefined>
}

export function SidebarMenuLink({ item, collapsed, badgeCounts }: SidebarMenuLinkProps) {
  if (!item.to) return null

  const Icon = item.icon
  const to = item.to
  const badgeCount = item.badgeKey ? badgeCounts?.[item.badgeKey] : undefined
  const showBadge = !collapsed && typeof badgeCount === 'number' && badgeCount > 0

  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-md px-4 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none',
          collapsed && 'justify-center px-0',
          collapsed
            ? cn(
                'focus-visible:ring-primary-foreground/40 dark:focus-visible:ring-card-foreground/40',
                isActive
                  ? 'bg-primary-foreground/15 font-medium text-primary-foreground dark:bg-card-foreground/15 dark:text-card-foreground'
                  : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground dark:text-card-foreground/70 dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground',
              )
            : cn(
                'focus-visible:ring-sidebar-ring',
                isActive
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              ),
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-full transition-opacity',
              collapsed ? 'bg-primary-foreground dark:bg-card-foreground' : 'bg-sidebar-primary',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
          {!collapsed && <span className="truncate">{item.label}</span>}
          {showBadge && (
            <Badge variant="secondary" className="ml-auto shrink-0 tabular-nums">
              {badgeCount}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  )
}
