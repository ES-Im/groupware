import type { ReactNode } from 'react'
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
 * 셸(LayoutShell) 밖이라 헤더/사이드바가 없으므로, 중앙 정렬 카드 레이아웃으로 독립적이되
 * 다크 헤더에 쓰인 primary 톤을 워드마크에 반영해 같은 제품 톤을 유지한다.
 * 데이터/로직은 각 페이지 컨테이너가 주입하는 children으로만 받는다(로직 없음).
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* 브랜드 워드마크: 다크 헤더(bg-primary)의 톤을 그대로 살린 포인트. */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center rounded-lg bg-primary px-3.5 py-1.5 text-base font-semibold tracking-tight text-primary-foreground">
            HARUON
          </span>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </main>
  )
}
