import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Check, Inbox } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'
import { DRAFT_TYPES, getDraftTypeMeta, type DraftTypeKey } from '../lib/draftTypes'

interface DraftCreateFrameProps {
  /** 현재 작성 중인 기안서 타입(좌측 카드 강조·우측 헤더 아이콘/문구의 기준). */
  currentType: DraftTypeKey
  /** 우측 폼 카드 본문에 렌더할 폼(제출·검증 로직은 페이지 소유). */
  children: ReactNode
}

/**
 * 기안서 작성 4종 공통 프레임(레퍼런스 "기안서 작성" 화면의 콘텐츠 프레임 이식).
 *
 * 순수 시각 계층만 담당한다: 페이지 헤더 + 2열 레이아웃(좌측 종류 선택 카드 / 우측 폼 카드).
 * 우측 카드의 본문(children)에 각 페이지가 자기 폼을 주입하며, 폼의 검증·제출·네비게이션 로직은
 * 페이지가 소유한다. 좌측 종류 전환은 라우트 이동(navigate)이라 각 작성 페이지가 새로 마운트되며
 * 로컬 입력 상태는 자연히 리셋된다.
 */
export function DraftCreateFrame({ currentType, children }: DraftCreateFrameProps) {
  const meta = getDraftTypeMeta(currentType)
  const HeaderIcon = meta.icon

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs text-muted-foreground">전자결재 · 기안서 작성</p>
          <h1 className="text-2xl font-semibold tracking-tight">새 기안서</h1>
          <p className="text-sm text-muted-foreground">
            업무에 맞는 양식을 선택해 결재 문서를 작성합니다.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/approval/box">
            <Inbox />
            문서함
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <DraftTypeSelector currentType={currentType} />

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <HeaderIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-base font-semibold">{meta.label}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {meta.description}
                </span>
              </span>
            </CardTitle>
            <CardAction>
              <Badge variant="secondary">작성 중</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}

/** 좌측 "기안서 종류" 선택 카드(4종 세로 나열, 현재 타입 강조, 클릭 시 해당 작성 라우트로 이동). */
function DraftTypeSelector({ currentType }: { currentType: DraftTypeKey }) {
  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="text-base">기안서 종류</CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-label="기안서 종류 선택" className="flex flex-col gap-1.5">
          {DRAFT_TYPES.map((type) => {
            const TypeIcon = type.icon
            const active = type.key === currentType
            return (
              <Link
                key={type.key}
                to={type.route}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                  active
                    ? 'border-primary/40 bg-accent'
                    : 'border-transparent hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <TypeIcon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{type.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </span>
                {active && <Check className="ml-auto size-4 shrink-0 text-primary" />}
              </Link>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}
