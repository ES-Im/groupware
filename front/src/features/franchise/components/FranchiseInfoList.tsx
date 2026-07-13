import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * franchise 도메인 라벨-값 정보 리스트(A안 톤 레퍼런스의 `.infolist`/`.inforow` 이식).
 *
 * 좁은 라벨 컬럼 + 값 컬럼의 행을 아래 경계선으로 구분해 쌓는다. 기본정보·문의 요약·교육 개요
 * 등 여러 화면이 공유해 한 시스템으로 보이게 한다. 순수 프레젠테이셔널: 표시할 항목은 상위가
 * props로 주입한다.
 */
export interface FranchiseInfoItem {
  label: string
  value: ReactNode
  /** 사업자번호·연락처처럼 자릿수 정렬이 필요한 값은 mono로 표기한다(레퍼런스 `.vl.mono`). */
  mono?: boolean
}

export function FranchiseInfoList({
  items,
  className,
}: {
  items: FranchiseInfoItem[]
  className?: string
}) {
  return (
    <dl className={cn('flex flex-col', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[96px_1fr] items-start gap-3 border-b border-border py-2.5 last:border-0"
        >
          <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
          <dd className={cn('text-sm break-words', item.mono && 'font-mono text-[13px]')}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
