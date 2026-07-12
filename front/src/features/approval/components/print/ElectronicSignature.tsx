import { cn } from '@/shared/lib/utils'

interface ElectronicSignatureProps {
  /** 서명 대상 이름(스크린리더용 aria-label 구성). */
  name: string
  /** drafter=기안자(파란 계열·좌로 기울임) / reviewer=결재자(붉은 계열·우로 기울임). */
  variant: 'drafter' | 'reviewer'
  /** 서명 우하단에 겹치는 상태 라벨(예: 상신·승인). */
  status: string
  className?: string
}

/**
 * 전자서명 마크(레퍼런스 draft/print의 ElectronicSignature 이식). 손글씨 느낌의 인라인 SVG 패스를
 * 원본 그대로 옮기고, print.scss의 `.electronic-signature`(회전·색·상태 배지) 스타일을 Tailwind로
 * 번역한다. A4 인쇄 문서 전용이라 색은 시맨틱 토큰이 아닌 고정색을 쓴다 — 다크모드에서도 흰 종이
 * 위에 찍힌 서명이어야 하므로 의도된 예외다(용지 전체가 고정색 규칙을 따른다).
 */
export function ElectronicSignature({ name, variant, status, className }: ElectronicSignatureProps) {
  const isDrafter = variant === 'drafter'
  return (
    <span
      aria-label={`${name} 전자서명`}
      className={cn(
        'relative mx-auto mt-[3px] block h-9 w-16',
        // 원본 색: drafter #2457a6(rotate -5deg) / reviewer #9b2c2c(rotate 3deg).
        isDrafter ? 'rotate-[-5deg] text-[#2457a6]' : 'rotate-[3deg] text-[#9b2c2c]',
        className,
      )}
    >
      <svg
        viewBox="0 0 80 38"
        role="img"
        aria-hidden="true"
        className="block size-full overflow-visible"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={2.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isDrafter ? (
            <>
              <path d="M5 27 C14 8, 19 9, 14 29 C20 18, 27 8, 25 28 C31 17, 39 15, 37 28" />
              <path d="M7 31 C26 25, 46 24, 73 28" />
            </>
          ) : (
            <>
              <path d="M5 25 C12 7, 22 7, 16 27 C24 13, 31 11, 27 29 C38 8, 44 10, 40 29" />
              <path d="M42 23 C49 12, 57 13, 53 27 C60 17, 67 16, 73 23" />
              <path d="M8 31 C29 27, 51 27, 75 30" />
            </>
          )}
        </g>
      </svg>
      <span className="absolute right-[-1px] bottom-[-2px] bg-white px-[2px] text-[8px] leading-[1.2] font-bold text-current">
        {status}
      </span>
    </span>
  )
}
