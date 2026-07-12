import { useId, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Check, FileText, FileUp, Inbox, Paperclip, Plus, X } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { cn } from '@/shared/lib/utils'
import { DRAFT_TYPES, getDraftTypeMeta, type DraftTypeKey } from '../lib/draftTypes'

interface DraftCreateFrameProps {
  /** 현재 작성 중인 기안서 타입(좌측 카드 강조·우측 헤더 아이콘/문구의 기준). */
  currentType: DraftTypeKey
  /** 첨부 예정 파일 목록(소유·유지는 페이지 — 미리보기 payload에 파일명이 실린다). */
  attachments: File[]
  /** 첨부 목록 변경 콜백(추가/제거 모두 이 콜백으로 반영). */
  onAttachmentsChange: (next: File[]) => void
  /** 우측 폼 카드 본문에 렌더할 폼(제출·검증 로직은 페이지 소유). */
  children: ReactNode
}

/**
 * 기안서 작성 4종 공통 프레임(레퍼런스 "기안서 작성" 화면의 콘텐츠 프레임 이식).
 *
 * 순수 시각 계층만 담당한다: 페이지 헤더 + 2열 레이아웃(좌측 종류 선택·첨부파일 카드 / 우측 폼
 * 카드). 우측 카드의 본문(children)에 각 페이지가 자기 폼을 주입하며, 폼의 검증·제출·네비게이션
 * 로직은 페이지가 소유한다. 좌측 종류 전환은 라우트 이동(navigate)이라 각 작성 페이지가 새로
 * 마운트되며 로컬 입력 상태는 자연히 리셋된다.
 *
 * 첨부파일 카드는 레퍼런스와 동일하게 **화면 보관·미리보기 표시까지만** 담당한다 — 백엔드 생성
 * 계약(GENERAL_DRAFT_CREATE 등)에 파일 필드가 없어 생성 요청에는 실리지 않고, 실제 업로드는
 * 생성 후 상세 AttachmentSection에서 진행한다(②③④⑤ 선례).
 */
export function DraftCreateFrame({
  currentType,
  attachments,
  onAttachmentsChange,
  children,
}: DraftCreateFrameProps) {
  const meta = getDraftTypeMeta(currentType)
  const HeaderIcon = meta.icon

  return (
    // 레퍼런스는 콘텐츠 영역 전체 폭을 사용한다 — 고정폭(max-w) 없이 LayoutShell main 폭에 맞춘다.
    // 공통 인셋은 p-3 하나로 통일(LayoutShell main은 패딩이 없어 각 페이지 래퍼가 인셋을 소유).
    // min-h-full 플렉스 컬럼: 폼이 짧아도 그리드(flex-1)가 남는 높이를 흡수해 카드 하단과 푸터
    // 사이 간격이 페이지 인셋(p-3)만 남는다.
    <div className="flex min-h-full w-full flex-col p-3">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">새 기안서</h1>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/approval/box">
            <Inbox />
            문서함
          </Link>
        </Button>
      </header>

      {/* 2열 비율은 레퍼런스(lg 4:8 → 1:2, xl 3:9 → 1:3)를 따른다. minmax(0,…)로 우측 폼 카드의
          긴 값이 컬럼을 밀어내지 않게 오버플로를 가둔다. flex-1이라 남는 세로 공간을 그리드 행이
          흡수하고(align-content 기본 stretch), 우측 폼 카드가 그 높이를 채운다. */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-4">
          <DraftTypeSelector currentType={currentType} />
          <DraftAttachmentsCard attachments={attachments} onChange={onAttachmentsChange} />
        </div>

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <HeaderIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{meta.label}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {meta.description}
                </span>
              </span>
            </CardTitle>
            <CardAction>
              <Badge variant="secondary">작성 중</Badge>
            </CardAction>
          </CardHeader>
          {/* 카드가 그리드 행 높이만큼 늘어날 때 폼(flex-1)도 같이 늘어나 액션 바가 카드 하단에 붙는다. */}
          <CardContent className="flex flex-1 flex-col">{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}

/** 좌측 "기안서 종류" 선택 카드(4종 세로 나열, 현재 타입 강조, 클릭 시 해당 작성 라우트로 이동). */
function DraftTypeSelector({ currentType }: { currentType: DraftTypeKey }) {
  const roles = useAuthStore((state) => state.roles)
  // minRole 게이팅(사이드바 컨벤션 동일): 권한 없는 종류(예: 매출보고서=FRANCHISE)는 카드에서
  // 숨긴다. UI 힌트일 뿐 최종 판정은 서버 403.
  const visibleTypes = DRAFT_TYPES.filter(
    (type) => !type.minRole || hasRequiredRole(roles, type.minRole),
  )

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="text-sm font-semibold">기안서 종류</CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-label="기안서 종류 선택" className="flex flex-col gap-1.5">
          {visibleTypes.map((type) => {
            const TypeIcon = type.icon
            const active = type.key === currentType
            return (
              <Link
                key={type.key}
                to={type.route}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
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
                  <TypeIcon className="size-5" />
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

/** 파일 크기 표기(레퍼런스 formatFileSize 이식 — B/KB/MB 3단). */
function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 좌측 "첨부파일" 카드(레퍼런스 좌측 첨부 카드 이식). 같은 이름+크기 파일은 중복 추가하지 않는다.
 * 선택 즉시 업로드하지 않고 목록만 보관한다 — 파일명은 미리보기 문서의 "첨부 문서" 목록에 실린다.
 */
function DraftAttachmentsCard({
  attachments,
  onChange,
}: {
  attachments: File[]
  onChange: (next: File[]) => void
}) {
  const inputId = useId()

  function addFiles(files: FileList | null) {
    if (!files) {
      return
    }
    const added = Array.from(files).filter(
      (file) => !attachments.some((item) => item.name === file.name && item.size === file.size),
    )
    if (added.length > 0) {
      onChange([...attachments, ...added])
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Paperclip className="size-4 text-muted-foreground" />
          첨부파일
        </CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <label htmlFor={inputId} className="cursor-pointer">
              <Plus />
              파일 추가
            </label>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <input
          id={inputId}
          type="file"
          multiple
          className="sr-only"
          aria-label="기안서 첨부파일"
          onChange={(event) => {
            addFiles(event.target.files)
            // 같은 파일을 다시 골라도 change가 발생하도록 입력값을 비운다(레퍼런스 동형).
            event.target.value = ''
          }}
        />
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-4 text-center text-muted-foreground">
            <FileUp className="size-6" />
            <p className="text-xs">첨부된 파일이 없습니다.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {attachments.map((file) => {
              const extension = file.name.includes('.')
                ? file.name.split('.').pop()?.toUpperCase()
                : 'FILE'
              return (
                <li
                  key={`${file.name}-${file.size}`}
                  className="flex items-center gap-2 rounded-lg border p-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" title={file.name}>
                      {file.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {extension} · {formatFileSize(file.size)}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    aria-label={`${file.name} 첨부 제거`}
                    onClick={() => onChange(attachments.filter((item) => item !== file))}
                  >
                    <X />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          목록은 미리보기 문서에 표시되며, 실제 업로드는 기안 생성 후 상세 화면에서 진행합니다.
        </p>
      </CardContent>
    </Card>
  )
}
