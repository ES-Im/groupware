import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface ErrorViewProps {
  /** 초대형 그라데이션 영역에 들어갈 값. 숫자 문자열('404') 또는 아이콘 노드 */
  code: ReactNode
  /** 굵은 대문자급 제목 (한국어) */
  title: string
  /** 회색 본문 설명 */
  description: ReactNode
  /** 카드 하단 CTA 영역. 미지정 시 렌더하지 않음 */
  actions?: ReactNode
  /**
   * page: 화면 전체를 덮는 회색 배경 + 중앙 카드 (레이아웃 셸 밖에서 사용)
   * embedded: 배경 없이 카드만, 부모 콘텐츠 영역에 맞춰 중앙 정렬 (사이드바 유지 화면에서 사용)
   */
  variant?: 'page' | 'embedded'
}

/**
 * 파스텔 기하 도형 데코(레퍼런스 디자인의 카드 우상단 장식). 프로젝트 시맨틱 토큰으로는
 * 표현할 수 없는 순수 장식 요소라 예외적으로 Tailwind 팔레트 클래스를 사용한다.
 *
 * 카드 밖으로 일부 넘치도록 배치하되, 부모 카드의 overflow-hidden이 잘라내므로 문서 레벨의
 * 가로 스크롤은 생기지 않는다. aria-hidden으로 스크린리더에서는 완전히 배제한다.
 * 다크 테마에서는 파스텔이 과하게 튀므로 투명도를 낮춘다.
 */
function ErrorDecoration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 dark:opacity-40">
      <span className="absolute -top-4 -right-3 size-16 rounded-full bg-pink-300/40" />
      <span className="absolute -top-2 right-8 size-12 rotate-12 rounded-2xl bg-amber-200/50" />
      <span className="absolute top-6 -right-6 size-14 rounded-full bg-sky-300/40" />
      <span className="absolute top-10 right-3 size-9 rotate-45 rounded-lg bg-blue-300/40" />
      <span className="absolute top-14 right-16 size-4 rounded-full bg-pink-400/30" />
    </div>
  )
}

/**
 * 에러/점검 화면 공통 시각 프리미티브(순수 프레젠테이셔널, 로직 없음).
 * 흰 카드 중앙 정렬 + 상단 HARUON 로고 + 초대형 그라데이션 상태코드 + 제목 + 설명 + CTA 구성.
 *
 * 로고는 AuthShell과 동일한 라이트/다크 스왑 패턴을 복제한다 — 카드 배경(bg-card)이 라이트에서
 * 밝고 다크에서 어두우므로, 라이트엔 검은 워드마크(haruon-logo-dark.svg), 다크엔 흰 워드마크
 * (haruon-logo.svg)를 쓴다.
 *
 * 접근성: 상태코드 숫자·아이콘은 그 자체로는 의미를 전달하지 못하므로 aria-hidden으로 감추고,
 * 실질 정보는 h1 제목과 설명 본문이 담는다. 카드 전체를 role="alert"로 노출해 라우트 전환 후
 * 마운트되는 시점에 스크린리더가 오류 상황을 즉시 알리도록 한다.
 */
export function ErrorView({
  code,
  title,
  description,
  actions,
  variant = 'page',
}: ErrorViewProps) {
  // 문자열/숫자 코드는 그라데이션 텍스트로, 아이콘 노드는 각 화면이 스스로 스타일링한 그대로 렌더한다.
  const isTextCode = typeof code === 'string' || typeof code === 'number'

  return (
    <section
      role="alert"
      className={cn(
        'flex w-full items-center justify-center px-4 py-10 sm:px-6',
        // page: 레이아웃 셸 밖 단독 화면이라 뷰포트 전체를 덮는 회색 배경을 직접 깐다.
        // embedded: 이미 셸 안(main의 bg-muted/30)이므로 배경을 겹쳐 깔지 않는다.
        variant === 'page' ? 'min-h-svh bg-muted/40' : 'h-full min-h-[60vh]',
      )}
    >
      <div className="relative w-full max-w-[370px] overflow-hidden rounded-2xl bg-card px-8 py-14 shadow-2xl shadow-foreground/5">
        <ErrorDecoration />
        {/* 데코 위로 콘텐츠를 올린다(데코는 absolute inset-0). */}
        <div className="relative flex flex-col items-center text-center">
          <img
            src="/haruon-logo-dark.svg"
            alt="HARUON"
            className="h-8 w-auto shrink-0 dark:hidden"
          />
          <img src="/haruon-logo.svg" alt="HARUON" className="hidden h-8 w-auto shrink-0 dark:block" />

          <p
            aria-hidden="true"
            className={cn(
              'mt-10 font-black leading-none tracking-tight',
              isTextCode &&
                'bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-[3.5rem] text-transparent sm:text-[4rem]',
            )}
          >
            {code}
          </p>

          <h1 className="mt-4 text-xl font-bold tracking-tight break-keep text-foreground">
            {title}
          </h1>

          {/* description은 ReactNode라 소비자가 여러 문단을 넘길 수 있어, p 중첩(무효 마크업)을
              피하려고 div로 감싼다. break-keep(word-break: keep-all)은 한국어가 어절 중간에서
              끊기는 것을 막는다 — 없으면 "요청한 작업/을 수행할"처럼 부자연스럽게 잘린다. */}
          <div className="mt-3 text-sm leading-relaxed break-keep text-balance text-muted-foreground">
            {description}
          </div>

          {actions && <div className="mt-8 flex flex-wrap justify-center gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  )
}
