import type { ReactNode } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

/**
 * 회의 도메인 화면(A안 톤 재디자인) 전용 시각 원자 모음.
 *
 * 5개 회의 화면(회의실 관리·상세, 회의 예약, 예약 관리·상세)이 공통으로 쓰는 상태 필/아바타
 * 이니셜/수용 인원 라벨을 한 곳에 모아 룩을 일관되게 유지한다. 기능 로직은 없고 순수 표현
 * 계층이며, 색은 프로젝트 토큰(primary·muted·border)을 우선 사용하고 "사용 가능/활성" 계열의
 * 초록만 emerald 팔레트를 쓴다(중립 토큰에 초록이 없어서 — 기존 amber 경고 색과 동일한 예외).
 */

export type StatusTone = 'green' | 'slate' | 'indigo'

const toneStyles: Record<StatusTone, string> = {
  green:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20',
  slate: 'bg-muted text-muted-foreground ring-border',
  indigo: 'bg-primary/10 text-primary ring-primary/20',
}

const dotStyles: Record<StatusTone, string> = {
  green: 'bg-emerald-500',
  slate: 'bg-muted-foreground/60',
  indigo: 'bg-primary',
}

/** 앞에 색 점이 붙는 알약형 상태 배지. 활성/예약중/취소됨 등 상태 표시에 사용. */
export function StatusPill({
  tone = 'green',
  children,
  className,
}: {
  tone?: StatusTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        toneStyles[tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dotStyles[tone])} />
      {children}
    </span>
  )
}

/** 카드 헤더 등에 붙는 개수/기간 요약 알약(강조 없는 primary 틴트). */
export function CountPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** 이름에서 아바타 이니셜(한글/영문 앞 2글자)을 뽑는다. 표시용 파생값이다. */
export function meetingInitials(name: string): string {
  return name.replace(/[^가-힣A-Za-z]/g, '').slice(0, 2) || '—'
}

/** 이름 이니셜 원형 아바타(순수 장식이라 스크린리더에서 숨긴다). */
export function InitialAvatar({
  name,
  size = 'sm',
  className,
}: {
  name: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary',
        size === 'md' ? 'size-9 text-xs' : 'size-7 text-[10px]',
        className,
      )}
    >
      {meetingInitials(name)}
    </span>
  )
}

/** 사람 아이콘 + "N명" 수용 인원/참여자 수 라벨. */
export function CapacityLabel({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 tabular-nums text-muted-foreground', className)}>
      <Users className="size-4 text-muted-foreground" />
      {value}명
    </span>
  )
}
