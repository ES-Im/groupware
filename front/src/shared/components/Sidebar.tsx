import { SidebarMenuGroup } from '@/shared/components/SidebarMenuGroup'
import { SidebarMenuLink } from '@/shared/components/SidebarMenuLink'
import { SidebarMenuPlaceholder } from '@/shared/components/SidebarMenuPlaceholder'
import { SidebarSectionHeader } from '@/shared/components/SidebarSectionHeader'
import { sidebarMenuItems } from '@/shared/components/sidebarMenuItems'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { cn } from '@/shared/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

interface SidebarProps {
  collapsed: boolean
  roles: string[]
  onExpandSidebar: () => void
  isMobile: boolean
  mobileOpen: boolean
  onCloseMobileSidebar: () => void
  badgeCounts?: Record<string, number | undefined>
}

export function Sidebar({
  collapsed,
  roles,
  onExpandSidebar,
  isMobile,
  mobileOpen,
  onCloseMobileSidebar,
  badgeCounts,
}: SidebarProps) {
  const renderMenuNav = (collapsedView: boolean) => (
    <nav
      className={cn(
        'flex flex-col gap-0.5 pb-3 text-sm',
        collapsedView ? 'px-2 pt-3' : 'px-3',
      )}
    >
      {sidebarMenuItems
        .filter((item) => hasRequiredRole(roles, item.minRole))
        .flatMap((item, index, visibleItems) => {
          const nodes = []
          if (item.section && item.section !== visibleItems[index - 1]?.section) {
            nodes.push(
              <SidebarSectionHeader
                key={`section-${item.section}`}
                title={item.section}
                collapsed={collapsedView}
              />,
            )
          }
          if (item.children) {
            nodes.push(
              <SidebarMenuGroup
                key={item.label}
                item={item}
                roles={roles}
                collapsed={collapsedView}
                onExpandSidebar={onExpandSidebar}
                badgeCounts={badgeCounts}
              />,
            )
          } else if (item.implemented !== false) {
            nodes.push(
              <SidebarMenuLink
                key={item.label}
                item={item}
                collapsed={collapsedView}
                badgeCounts={badgeCounts}
              />,
            )
          } else {
            nodes.push(<SidebarMenuPlaceholder key={item.label} item={item} collapsed={collapsedView} />)
          }
          return nodes
        })}
    </nav>
  )

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={(next) => !next && onCloseMobileSidebar()}>
        <SheetContent
          side="left"
          className="gap-0 border-sidebar-border bg-sidebar text-sidebar-foreground"
        >
          <SheetHeader className="px-7 pt-5 pb-2">
            <SheetTitle className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              메뉴
            </SheetTitle>
          </SheetHeader>
          {renderMenuNav(false)}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-r transition-[width,background-color,border-color] duration-200 ease-in-out',
        collapsed
          ? 'border-primary-foreground/10 bg-primary text-primary-foreground w-16 dark:border-card-foreground/10 dark:bg-card dark:text-card-foreground'
          : 'border-sidebar-border bg-sidebar text-sidebar-foreground w-56 lg:w-64',
      )}
    >
      {!collapsed && (
        <p className="px-7 pt-5 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          메뉴
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{renderMenuNav(collapsed)}</div>
    </aside>
  )
}
