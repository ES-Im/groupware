import { LogOut, MessagesSquare } from 'lucide-react'
import { RailAttendanceTiles } from '@/features/attendance/components/RailAttendanceTiles'
import { useChatOverlayStore } from '@/features/chat/lib/chatOverlayStore'
import { useCompanyInfoQuery } from '@/features/company/api/useCompanyInfoQuery'
import type { CurrentDept } from '@/features/employee/model/me'
import { RailReminderPanel } from '@/features/message/components/RailReminderPanel'
import { RailMiniCalendar } from '@/features/schedule/components/RailMiniCalendar'
import { BlobAvatar } from '@/shared/components/BlobAvatar'

const FALLBACK_COMPANY_NAME = '하루온 그룹(HARUON Group)'

interface ProfileRailPanelProps {
  me:
    | {
        empBasicInfo: { empId: number; name: string; empNo: string }
        currentDepts: CurrentDept[]
      }
    | undefined
  profilePictureFileId?: number
  onLogout: () => void
  logoutPending: boolean
}

export function ProfileRailPanel({ me, profilePictureFileId, onLogout, logoutPending }: ProfileRailPanelProps) {
  const toggleChatOverlay = useChatOverlayStore((state) => state.toggle)
  const { data: companyInfo } = useCompanyInfoQuery()

  if (!me) {
    return (
      <aside className="hidden w-72 shrink-0 border-l border-primary-foreground/10 bg-primary lg:block dark:border-card-foreground/10 dark:bg-card" />
    )
  }

  const primaryDept = me.currentDepts.find((dept) => dept.isPrimary) ?? me.currentDepts[0]

  return (
    <aside className="hidden w-72 shrink-0 flex-col divide-y divide-primary-foreground/10 overflow-y-auto border-l border-primary-foreground/10 bg-primary text-primary-foreground lg:flex dark:divide-card-foreground/10 dark:border-card-foreground/10 dark:bg-card dark:text-card-foreground">
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center gap-2 pb-4 text-center">
          <BlobAvatar
            empId={me.empBasicInfo.empId}
            fileId={profilePictureFileId}
            fallbackText={me.empBasicInfo.name}
            className="size-14 bg-primary-foreground/15 text-base text-primary-foreground dark:bg-card-foreground/15 dark:text-card-foreground"
          />
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold tracking-wide text-primary-foreground/60 uppercase dark:text-card-foreground/60">
              Welcome Back
            </p>
            <p className="text-sm font-semibold">{me.empBasicInfo.name}님, 좋은 하루입니다.</p>
          </div>
          {primaryDept && (
            <p className="text-xs text-primary-foreground/70 dark:text-card-foreground/70">
              {primaryDept.deptName} · {primaryDept.positionName} · {me.empBasicInfo.empNo}
            </p>
          )}
        </div>
        <RailAttendanceTiles />
      </div>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={toggleChatOverlay}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/20 dark:border-card-foreground/20 dark:bg-card-foreground/10 dark:text-card-foreground dark:hover:bg-card-foreground/20"
        >
          <MessagesSquare className="size-4" aria-hidden="true" />
          채팅 바로가기
        </button>
      </div>

      <div className="px-4 py-4">
        <RailMiniCalendar />
      </div>

      <RailReminderPanel />

      <div className="mt-auto px-4 py-4">
        <button
          type="button"
          onClick={onLogout}
          disabled={logoutPending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-primary-foreground/20 py-2 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50 dark:border-card-foreground/20 dark:text-card-foreground/70 dark:hover:bg-card-foreground/10"
        >
          <LogOut className="size-4" aria-hidden="true" />
          로그아웃
        </button>
        <div className="mt-4 border-t border-primary-foreground/10 pt-4 text-center dark:border-card-foreground/10">
          {companyInfo ? (
            <>
              <p className="text-xs font-medium text-primary-foreground/70 dark:text-card-foreground/70">
                {companyInfo.companyName} · 대표 {companyInfo.ownerName}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                {companyInfo.location}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                대표전화 {companyInfo.presentedExternalNo}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                이메일 {companyInfo.presentedEmail}
              </p>
              <a
                href={companyInfo.homePageURL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-[10px] text-primary-foreground/50 underline underline-offset-2 hover:text-primary-foreground dark:text-card-foreground/50 dark:hover:text-card-foreground"
              >
                {companyInfo.homePageURL}
              </a>
              <p className="mt-2 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                &copy; {new Date().getFullYear()} {companyInfo.companyName}. All rights reserved.
              </p>
            </>
          ) : (
            <p className="text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
              &copy; {new Date().getFullYear()} {FALLBACK_COMPANY_NAME}. All rights reserved.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
