import { Menu, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'

/**
 * 사이드바 접힘/펼침 토글 버튼(순수 시각 요소). 헤더 좌측 최전방에 배치한다.
 * 실제 상태는 상위(LayoutShell)의 useSidebarCollapsed(데스크톱)/useMobileSidebarOpen(모바일)이
 * 소유하고, 여기서는 클릭을 전달만 한다.
 * 참고 스크린샷처럼 어두운 헤더 위에서도 또렷이 구분되도록 테두리가 있는 박스형 버튼으로 스타일링한다.
 * 헤더 배경은 라이트=bg-primary, 다크=bg-card(둘 다 어두운 크롬 톤)이므로, 전경(테두리·아이콘)은
 * 라이트에서 primary-foreground, 다크에서 card-foreground(둘 다 밝은색)로 스왑해 대비를 유지한다.
 */
interface SidebarToggleButtonProps {
  collapsed: boolean
  onToggle: () => void
  /** 모바일 뷰포트 여부(useIsMobile). 열림 아이콘(햄버거 ↔ X)·aria 의미 전환의 기준. */
  isMobile: boolean
  /** 모바일 드로어 열림 여부(useMobileSidebarOpen). */
  mobileSidebarOpen: boolean
}

export function SidebarToggleButton({
  collapsed,
  onToggle,
  isMobile,
  mobileSidebarOpen,
}: SidebarToggleButtonProps) {
  // 열림 상태: 데스크톱은 접힘/펼침(!collapsed), 모바일은 드로어 열림(mobileSidebarOpen)이 기준.
  const expanded = isMobile ? mobileSidebarOpen : !collapsed
  // 모바일 드로어가 열려 있을 때만 닫힘(X) 아이콘으로 전환한다(데스크톱은 항상 햄버거 유지).
  const showCloseIcon = isMobile && mobileSidebarOpen

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      aria-label={showCloseIcon ? '사이드바 닫기' : '사이드바 열기'}
      aria-expanded={expanded}
      // 데스크톱(lg 이상)에서는 커진 헤더에 맞춰 버튼을 size-8→size-10, 아이콘을 size-4→size-5로
      // 비례 확대한다. 모바일(뷰포트 < lg)은 lg: 미적용이라 기존 size-8/size-4를 그대로 유지한다.
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
