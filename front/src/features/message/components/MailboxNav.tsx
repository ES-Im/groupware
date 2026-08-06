import { ArrowLeft, Info, MailPlus } from 'lucide-react'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { BOX_ORDER, BOX_TABS } from '../lib/mailboxConfig'
import type { MailBox, MessageCountResponse } from '../model/messageTypes'

interface MailboxNavProps {
  box: MailBox
  counts?: MessageCountResponse
  userName?: string
  userDept?: string
  onCompose: () => void
  onSelectBox: (box: MailBox) => void
  onBack?: () => void
  showBack?: boolean
  className?: string
}

export function MailboxNav({
  box,
  counts,
  userName,
  userDept,
  onCompose,
  onSelectBox,
  onBack,
  showBack,
  className,
}: MailboxNavProps) {
  const receivedCount = counts?.receivedCount ?? 0
  const unreadCount = counts?.unreadReceivedCount ?? 0
  const unreadPercent = receivedCount > 0 ? Math.round((unreadCount / receivedCount) * 100) : 0

  return (
    <aside className={cn('flex flex-col gap-4', className)}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {userName && (
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <BlobAvatar
                empId={undefined}
                fileId={undefined}
                fallbackText={userName}
                className="size-10"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{userName}</p>
                {userDept && <p className="truncate text-xs text-muted-foreground">{userDept}</p>}
              </div>
            </div>
          )}

          <Button type="button" onClick={onCompose} className="w-full">
            <MailPlus />
            새 쪽지 작성
          </Button>

          <nav aria-label="쪽지함 메일박스">
            <ul className="flex flex-col gap-1">
              {BOX_ORDER.map((key) => {
                const config = BOX_TABS[key]
                const Icon = config.icon
                const badge = counts ? config.getBadge(counts) : 0
                const emphasized =
                  counts && config.getEmphasizedBadge ? config.getEmphasizedBadge(counts) : 0
                const isActive = key === box
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => onSelectBox(key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        isActive
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{config.navLabel}</span>
                      <span className="ml-auto flex shrink-0 items-center gap-1">
                        {emphasized > 0 && (
                          <Badge
                            className="h-5 min-w-5 justify-center rounded-full tabular-nums"
                            aria-label={`안읽음 ${emphasized}건`}
                          >
                            {emphasized}
                          </Badge>
                        )}
                        {badge > 0 && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {badge}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3.5 text-xs leading-5 text-foreground">
        <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-primary">
          <Info className="size-4" aria-hidden="true" />
          쪽지함 안내
        </div>
        읽지 않은 쪽지는 목록에서 굵게·좌측 강조로 표시됩니다.
      </div>

      <div className="rounded-xl border border-border p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">읽지 않은 쪽지</span>
          <span className="font-semibold tabular-nums text-foreground">{unreadCount}건</span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={unreadCount}
          aria-valuemin={0}
          aria-valuemax={receivedCount}
          aria-label="읽지 않은 쪽지 비율"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${unreadPercent}%` }}
          />
        </div>
      </div>

      {showBack && onBack && (
        <Button type="button" variant="outline" onClick={onBack} className="w-full">
          <ArrowLeft />
          목록으로
        </Button>
      )}
    </aside>
  )
}
