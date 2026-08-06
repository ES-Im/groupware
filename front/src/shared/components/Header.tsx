import { useState } from 'react'
import type { FormEvent } from 'react'
import { Bell, ChevronDown, LogOut, MessagesSquare, Moon, Search, Sun, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { HeaderAttendanceQuickPanel } from '@/features/attendance/components/HeaderAttendanceQuickPanel'
import { useChatRoomsQuery } from '@/features/chat/api/useChatRoomsQuery'
import { useChatOverlayStore } from '@/features/chat/lib/chatOverlayStore'
import { useEmployeeSearchOverlayStore } from '@/features/employee/lib/employeeSearchOverlayStore'
import { HeaderUnreadMessagesPanel } from '@/features/message/components/HeaderUnreadMessagesPanel'
import { useMailboxCountsQuery } from '@/features/message/api/useMailboxCountsQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { SidebarToggleButton } from '@/shared/components/SidebarToggleButton'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

interface HeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  isMobile: boolean
  mobileSidebarOpen: boolean
  isDark: boolean
  onToggleDarkMode: () => void
  profileRailOpen: boolean
  onToggleProfileRail: () => void
  me: { empBasicInfo: { empId: number; name: string } } | undefined
  profilePictureFileId?: number
  onLogout: () => void
  logoutPending: boolean
}

const chromeIconButtonClass =
  'inline-flex size-8 items-center justify-center rounded-md text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none lg:size-10 dark:text-card-foreground/70 dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground dark:focus-visible:ring-card-foreground/40'

export function Header({
  collapsed,
  onToggleSidebar,
  isMobile,
  mobileSidebarOpen,
  isDark,
  onToggleDarkMode,
  profileRailOpen,
  onToggleProfileRail,
  me,
  profilePictureFileId,
  onLogout,
  logoutPending,
}: HeaderProps) {
  const toggleChatOverlay = useChatOverlayStore((state) => state.toggle)
  const openEmployeeSearch = useEmployeeSearchOverlayStore((state) => state.open)
  const [employeeSearchInput, setEmployeeSearchInput] = useState('')
  const mailboxCountsQuery = useMailboxCountsQuery()
  const unreadCount = mailboxCountsQuery.data?.unreadReceivedCount ?? 0
  const chatRoomsQuery = useChatRoomsQuery()
  const hasUnreadChat = (chatRoomsQuery.data ?? []).some(
    (room) => (room.unreadMessageCount ?? 0) > 0,
  )

  function handleSubmitEmployeeSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = employeeSearchInput.trim()
    if (!trimmed) {
      return
    }
    openEmployeeSearch(trimmed)
  }

  const rightCluster = (
    <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
      <form onSubmit={handleSubmitEmployeeSearch} className="hidden sm:block">
        <label htmlFor="header-employee-search" className="sr-only">
          부서·사원 검색
        </label>
        <div className="relative">
          <button
            type="submit"
            aria-label="부서·사원 검색"
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-primary-foreground/60 transition-colors hover:text-primary-foreground dark:text-card-foreground/60 dark:hover:text-card-foreground"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
          <input
            id="header-employee-search"
            type="search"
            value={employeeSearchInput}
            onChange={(event) => setEmployeeSearchInput(event.target.value)}
            placeholder="부서·사원 검색"
            className="h-9 w-44 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 pr-3 pl-8 text-sm text-primary-foreground transition-[width,background-color] placeholder:text-primary-foreground/50 outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40 md:w-56 lg:h-10 lg:w-72 dark:border-card-foreground/20 dark:bg-card-foreground/10 dark:text-card-foreground dark:placeholder:text-card-foreground/50 dark:focus-visible:ring-card-foreground/40"
          />
        </div>
      </form>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="알림" className={cn(chromeIconButtonClass, 'relative')}>
            <Bell className="size-4 lg:size-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto p-1.5">
          <HeaderUnreadMessagesPanel />
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        onClick={toggleChatOverlay}
        aria-label={hasUnreadChat ? '채팅 (읽지 않은 메시지 있음)' : '채팅'}
        className={cn(chromeIconButtonClass, 'relative')}
      >
        <MessagesSquare className="size-4 lg:size-5" aria-hidden="true" />
        {hasUnreadChat && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-destructive-foreground">
            <span className="lg:hidden">N</span>
            <span className="hidden lg:inline">New</span>
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onToggleDarkMode}
        aria-label="다크모드 전환"
        aria-pressed={isDark}
        className={chromeIconButtonClass}
      >
        {isDark ? (
          <Sun className="size-4 lg:size-5" aria-hidden="true" />
        ) : (
          <Moon className="size-4 lg:size-5" aria-hidden="true" />
        )}
      </button>
      {me &&
        (isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none dark:hover:bg-card-foreground/10 dark:focus-visible:ring-card-foreground/40"
              >
                <BlobAvatar
                  empId={me.empBasicInfo.empId}
                  fileId={profilePictureFileId}
                  fallbackText={me.empBasicInfo.name}
                  className="bg-primary-foreground/15 text-primary-foreground dark:bg-card-foreground/15 dark:text-card-foreground"
                />
                <span className="hidden text-sm font-medium text-primary-foreground sm:inline dark:text-card-foreground">
                  {me.empBasicInfo.name}
                </span>
                <ChevronDown
                  className="hidden size-3.5 text-primary-foreground/70 sm:inline dark:text-card-foreground/70"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                {me.empBasicInfo.name}님, 환영합니다
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <HeaderAttendanceQuickPanel />
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/me">
                  <UserRound aria-hidden="true" />
                  내 정보
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onLogout} disabled={logoutPending}>
                <LogOut aria-hidden="true" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={onToggleProfileRail}
            aria-pressed={profileRailOpen}
            aria-label={profileRailOpen ? '내 프로필 패널 닫기' : '내 프로필 패널 열기'}
            className={cn(
              'ml-1 flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none dark:hover:bg-card-foreground/10 dark:focus-visible:ring-card-foreground/40',
              profileRailOpen && 'bg-primary-foreground/10 dark:bg-card-foreground/10',
            )}
          >
            <BlobAvatar
              empId={me.empBasicInfo.empId}
              fileId={profilePictureFileId}
              fallbackText={me.empBasicInfo.name}
              className="bg-primary-foreground/15 text-primary-foreground lg:size-9 lg:text-sm dark:bg-card-foreground/15 dark:text-card-foreground"
            />
            <span className="text-sm font-medium text-primary-foreground lg:text-base dark:text-card-foreground">
              {me.empBasicInfo.name}
            </span>
            <ChevronDown
              className={cn(
                'size-3.5 text-primary-foreground/70 transition-transform lg:size-4 dark:text-card-foreground/70',
                profileRailOpen && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
    </div>
  )

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center bg-primary text-primary-foreground dark:bg-card dark:text-card-foreground',
        isMobile ? 'gap-2 px-4' : 'pr-4 lg:h-18',
      )}
    >
      {isMobile ? (
        <>
          <div className="flex items-center">
            <SidebarToggleButton
              collapsed={collapsed}
              onToggle={onToggleSidebar}
              isMobile={isMobile}
              mobileSidebarOpen={mobileSidebarOpen}
            />
            <Link to="/" className="ml-1.5 flex shrink-0 items-center sm:ml-2.5">
              <img src="/haruon-logo-sm.svg" alt="HARUON" className="size-8" />
            </Link>
          </div>
          {rightCluster}
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 pl-4">
            <SidebarToggleButton
              collapsed={collapsed}
              onToggle={onToggleSidebar}
              isMobile={isMobile}
              mobileSidebarOpen={mobileSidebarOpen}
            />
            <Link to="/" className="flex shrink-0 items-center">
              <img src="/haruon-logo.svg" alt="HARUON" className="h-7 w-auto lg:h-9" />
            </Link>
          </div>
          {rightCluster}
        </>
      )}
    </header>
  )
}
