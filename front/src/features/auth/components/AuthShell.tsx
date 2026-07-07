import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

interface AuthShellProps {
  /** 카드 제목(예: 로그인 / 회원가입). */
  title: string
  /** 제목 아래 보조 설명(선택). */
  description?: string
  /** 카드 본문(폼 또는 안내 문구 등). */
  children: ReactNode
  /** 카드 하단 보조 링크 영역(선택, 예: 회원가입/로그인 전환 링크). */
  footer?: ReactNode
}

/**
 * 비인증 라우트(로그인·회원가입·승인 대기) 공통 시각 셸(순수 프레젠테이셔널).
 * 좌(로고+폼, 30%) + 우(실사 이미지, 70%) 2단 레이아웃(3:7 비율, 사용자 확정).
 * - 좌측: 모바일은 전체 폭, lg 이상은 30%. 상단 중앙에 로고, 남은 공간 중앙에 폼 카드를 배치.
 * - 우측: lg 이상에서만 노출되는 실사 이미지(70%, `/login-cover.jpg`, object-cover 풀블리드).
 *   lg 미만에서는 숨겨 좌측 컬럼만 전체 폭으로 보인다.
 *
 * 로고는 이 셸의 배경(bg-background)이 라이트/다크 테마에서 일반적인 방향(라이트: 밝음 →
 * 다크: 어두움)으로 동작하므로, 헤더(bg-primary, 반전 토큰)와는 반대로 스왑한다 — 라이트
 * 테마(밝은 배경)엔 검은 글자 로고, 다크 테마(어두운 배경)엔 흰 글자 로고.
 *
 * 데이터/로직은 각 페이지 컨테이너가 주입하는 children으로만 받는다(로직 없음).
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-svh bg-background">
      {/* 좌측: 로고(상단) + 폼(남은 공간 중앙). 모바일 전체 폭, lg 이상 30%. */}
      <div className="flex w-full flex-col px-6 py-8 lg:w-[30%] lg:px-8 lg:py-10">
        <Link to="/" className="mx-auto inline-flex w-fit shrink-0">
          <img src="/haruon-logo-dark.svg" alt="HARUON" className="h-16 w-auto dark:hidden" />
          <img
            src="/haruon-logo.svg"
            alt="HARUON"
            className="hidden h-8 w-auto dark:block"
          />
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Card className="ring-0 shadow-none [--card-spacing:1.1rem]">
              <CardHeader className="pb-8 text-center">
                {/* 요청대로 기본 크기(text-lg, 1.125rem)의 3배(3.375rem) + bold로 로고와 폼 사이에서 존재감을 준다. */}
                <CardTitle className="text-[3.375rem] leading-tight font-bold">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
            {footer && (
              <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
            )}
          </div>
        </main>
      </div>

      {/* 우측: 실사 이미지 70%. 모바일에서는 숨기고 lg 이상에서만 노출. */}
      <div className="relative hidden overflow-hidden lg:block lg:w-[70%]">
        <img src="/login-cover.jpg" alt="" className="size-full object-cover" />
      </div>
    </div>
  )
}
