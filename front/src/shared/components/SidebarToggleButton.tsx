import { Menu, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface SidebarToggleButtonProps {
  collapsed: boolean
  onToggle: () => void
  isMobile: boolean
  mobileSidebarOpen: boolean
}

export function SidebarToggleButton({
  collapsed,
  onToggle,
  isMobile,
  mobileSidebarOpen,
}: SidebarToggleButtonProps) {
  const expanded = isMobile ? mobileSidebarOpen : !collapsed
  const showCloseIcon = isMobile && mobileSidebarOpen

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      aria-label={showCloseIcon ? '사이드바 닫기' : '사이드바 열기'}
      aria-expanded={expanded}
      className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground lg:size-10 dark:border-card-foreground/25 dark:text-card-foreground dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground"
    >
      {showCloseIcon ? (
        <X className="size-4 lg:size-5" aria-hidden="true" />
      ) : (
        <Menu className="size-4 lg:size-5" aria-hidden="true" />
      )}
    </Button>
  )
}
