import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useMyPendingApprovalDraftsCountQuery } from '@/features/approval/api/useMyPendingApprovalDraftsCountQuery'
import { logout } from '@/features/auth/api/logout'
import { useAuthStore } from '@/features/auth/store/authStore'
import { ChatOverlayPanel } from '@/features/chat/components/ChatOverlayPanel'
import { useFilesInfosQuery } from '@/features/employee/api/useFilesInfosQuery'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { EmployeeSearchOverlay } from '@/features/employee/components/EmployeeSearchOverlay'
import { useMailboxCountsQuery } from '@/features/message/api/useMailboxCountsQuery'
import { queryClient } from '@/shared/api/queryClient'
import { Footer } from '@/shared/components/Footer'
import { Header } from '@/shared/components/Header'
import { ProfileRailPanel } from '@/shared/components/ProfileRailPanel'
import { Sidebar } from '@/shared/components/Sidebar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { useDarkMode } from '@/shared/lib/useDarkMode'
import { useIsMobile } from '@/shared/lib/useIsMobile'
import { useMobileSidebarOpen } from '@/shared/lib/useMobileSidebarOpen'
import { useProfileRailOpen } from '@/shared/lib/useProfileRailOpen'
import { useSidebarCollapsed } from '@/shared/lib/useSidebarCollapsed'

export function LayoutShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: me } = useMeQuery()
  const { data: pendingApprovalDraftsCount } = useMyPendingApprovalDraftsCountQuery()
  const { data: mailboxCounts } = useMailboxCountsQuery()
  const clearAuth = useAuthStore((state) => state.clear)
  const roles = useAuthStore((state) => state.roles)
  const logoutMutation = useMutation({ mutationFn: logout })
  const { collapsed, toggle, expand } = useSidebarCollapsed()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const isMobile = useIsMobile()
  const {
    open: mobileSidebarOpen,
    toggle: toggleMobileSidebar,
    close: closeMobileSidebar,
  } = useMobileSidebarOpen()
  const { open: profileRailOpen, toggle: toggleProfileRail } = useProfileRailOpen()

  useEffect(() => {
    closeMobileSidebar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleToggleSidebar = isMobile ? toggleMobileSidebar : toggle

  const meActiveFiles = me?.activeFiles
  const needsFilesInfosFallback = !!me && (meActiveFiles == null || meActiveFiles.length === 0)
  const { data: filesInfos } = useFilesInfosQuery(needsFilesInfosFallback)
  const profilePictureFileId =
    getActiveProfilePicture(meActiveFiles ?? []) ?? getActiveProfilePicture(filesInfos ?? [])

  const badgeCounts: Record<string, number | undefined> = {
    approvalPending: pendingApprovalDraftsCount,
    messageUnread: mailboxCounts?.unreadReceivedCount,
  }

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync()
    } catch {
    } finally {
      clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <Header
        collapsed={collapsed}
        onToggleSidebar={handleToggleSidebar}
        isMobile={isMobile}
        mobileSidebarOpen={mobileSidebarOpen}
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
        profileRailOpen={profileRailOpen}
        onToggleProfileRail={toggleProfileRail}
        me={me}
        profilePictureFileId={profilePictureFileId}
        onLogout={handleLogout}
        logoutPending={logoutMutation.isPending}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={collapsed}
          roles={roles}
          onExpandSidebar={expand}
          isMobile={isMobile}
          mobileOpen={mobileSidebarOpen}
          onCloseMobileSidebar={closeMobileSidebar}
          badgeCounts={badgeCounts}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <Outlet />
          </main>
          <Footer />
        </div>
        {!isMobile && profileRailOpen && (
          <ProfileRailPanel
            me={me}
            profilePictureFileId={profilePictureFileId}
            onLogout={handleLogout}
            logoutPending={logoutMutation.isPending}
          />
        )}
      </div>
      <ChatOverlayPanel />
      <EmployeeSearchOverlay />
    </div>
  )
}
