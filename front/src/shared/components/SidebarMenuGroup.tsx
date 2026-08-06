import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { SidebarMenuLink } from '@/shared/components/SidebarMenuLink'
import { SidebarMenuPlaceholder } from '@/shared/components/SidebarMenuPlaceholder'
import type { SidebarMenuItem } from '@/shared/components/sidebarMenuItems'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { cn } from '@/shared/lib/utils'

interface SidebarMenuGroupProps {
  item: SidebarMenuItem
  roles: string[]
  collapsed: boolean
  onExpandSidebar: () => void
  badgeCounts?: Record<string, number | undefined>
}

export function SidebarMenuGroup({
  item,
  roles,
  collapsed,
  onExpandSidebar,
  badgeCounts,
}: SidebarMenuGroupProps) {
  const [open, setOpen] = useState(false)

  const visibleChildren = (item.children ?? []).filter((child) =>
    hasRequiredRole(roles, child.minRole),
  )
  if (visibleChildren.length === 0) return null

  const Icon = item.icon

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => {
          onExpandSidebar()
          setOpen(true)
        }}
        title={item.label}
        className="flex w-full items-center justify-center rounded-md px-0 py-2 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-foreground/40 focus-visible:outline-none dark:text-card-foreground/70 dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground dark:focus-visible:ring-card-foreground/40"
      >
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
      </button>
    )
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center gap-3 rounded-md px-4 py-2 text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring focus-visible:outline-none"
      >
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
        <span className="truncate">{item.label}</span>
        <ChevronRight
          aria-hidden="true"
          className={cn('ml-auto size-4 shrink-0 transition-transform', open && 'rotate-90')}
        />
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5 pl-4">
          {visibleChildren.map((child) =>
            child.implemented !== false ? (
              <SidebarMenuLink
                key={child.label}
                item={child}
                collapsed={false}
                badgeCounts={badgeCounts}
              />
            ) : (
              <SidebarMenuPlaceholder key={child.label} item={child} collapsed={false} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
