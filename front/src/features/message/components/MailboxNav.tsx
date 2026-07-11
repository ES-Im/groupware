import { MailPlus } from 'lucide-react'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { BOX_ORDER, BOX_TABS } from '../lib/mailboxConfig'
import type { MailBox, MessageCountResponse } from '../model/messageTypes'

interface MailboxNavProps {
  /** 현재 활성 박스(URL /messages/:box). */
  box: MailBox
  /** 건수 배지·안읽음 프로그레스 소스(F1510). 미로딩 시 0으로 표기한다. */
  counts?: MessageCountResponse
  /** 사용자 카드 표시명(me.empBasicInfo.name). 없으면 사용자 카드를 렌더하지 않는다. */
  userName?: string
  /** 사용자 카드 보조 라벨("부서명 · 직급"). 선택. */
  userDept?: string
  /** [새 쪽지 작성] — 카드 내 작성 뷰 전환 트리거(상위 소유). */
  onCompose: () => void
  /** 박스 선택 — 상위가 /messages/:box로 navigate(라우팅 로직은 상위 소유). */
  onSelectBox: (box: MailBox) => void
  className?: string
}

/**
 * 쪽지함 좌측 박스 네비 서브사이드바(옵션 B, 레퍼런스 메일함 이식). 데스크톱(xl+)에서만 노출되는
 * 순수 시각 컴포넌트로, 박스 전환·작성 진입은 전부 상위(MessageBoxPage)가 주입한 콜백에 위임한다
 * (데이터 페칭·라우팅 로직 없음). 구성: [새 쪽지 작성] 버튼 + 사용자 카드 + 박스 세로 리스트
 * (건수 배지) + 안읽음 프로그레스.
 */
export function MailboxNav({
  box,
  counts,
  userName,
  userDept,
  onCompose,
  onSelectBox,
  className,
}: MailboxNavProps) {
  const receivedCount = counts?.receivedCount ?? 0
  const unreadCount = counts?.unreadReceivedCount ?? 0
  // 안읽음 비율(읽지 않은 쪽지 / 받은 쪽지 전체). 받은 쪽지가 없으면 0%로 둔다.
  const unreadPercent = receivedCount > 0 ? Math.round((unreadCount / receivedCount) * 100) : 0

  return (
    <aside className={cn('flex flex-col gap-4', className)}>
      <Button type="button" onClick={onCompose} className="w-full">
        <MailPlus />
        새 쪽지 작성
      </Button>

      {/* 사용자 카드: 아바타(이니셜 폴백) + 이름 + 부서·직급. */}
      {userName && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <BlobAvatar empId={undefined} fileId={undefined} fallbackText={userName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
            {userDept && <p className="truncate text-xs text-muted-foreground">{userDept}</p>}
          </div>
        </div>
      )}

      {/* 박스 세로 리스트: 활성 박스는 accent 톤으로 강조하고, 건수 배지를 우측에 정렬한다. */}
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
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    isActive
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{config.navLabel}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    {/* 받은함 안읽음 강조 배지(primary 톤) — 전체 건수 배지와 구분한다. */}
                    {emphasized > 0 && (
                      <Badge className="tabular-nums" aria-label={`안읽음 ${emphasized}건`}>
                        {emphasized}
                      </Badge>
                    )}
                    {badge > 0 && (
                      <Badge variant="secondary" className="tabular-nums">
                        {badge}
                      </Badge>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 안읽음 프로그레스: 받은 쪽지 중 미읽음 비율을 시각화한다(레퍼런스 메일함 톤). */}
      <div className="rounded-lg border border-border p-3">
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
    </aside>
  )
}
