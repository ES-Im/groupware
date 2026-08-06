import { useId, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Check, FileText, FileUp, Inbox, Paperclip, Plus, X, type LucideIcon } from 'lucide-react'
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
  currentType: DraftTypeKey
  attachments?: File[]
  onAttachmentsChange?: (next: File[]) => void
  children: ReactNode
  title?: string
  subtitle?: string
  formIcon?: LucideIcon
  formTitle?: string
  formDescription?: string
  headerBadge?: string
  sidebar?: ReactNode
  banner?: ReactNode
}

export function DraftCreateFrame({
  currentType,
  attachments,
  onAttachmentsChange,
  children,
  title = '새 기안서',
  subtitle = '결재 양식을 선택하고 필요한 내용을 작성하세요',
  formIcon,
  formTitle,
  formDescription,
  headerBadge = '작성 중',
  sidebar,
  banner,
}: DraftCreateFrameProps) {
  const meta = getDraftTypeMeta(currentType)
  const HeaderIcon = formIcon ?? meta.icon

  return (
    <div className="flex min-h-full w-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild variant="outline" className="shrink-0 rounded-xl">
          <Link to="/approval/box">
            <Inbox />
            문서함
          </Link>
        </Button>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-4">
          {sidebar ?? (
            <>
              <DraftTypeSelector currentType={currentType} />
              {attachments && onAttachmentsChange && (
                <DraftAttachmentsCard attachments={attachments} onChange={onAttachmentsChange} />
              )}
            </>
          )}
        </div>

        <Card className="min-w-0 rounded-2xl">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HeaderIcon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-base font-bold">{formTitle ?? meta.label}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {formDescription ?? meta.description}
                </span>
              </span>
            </CardTitle>
            <CardAction>
              <Badge className="rounded-full border-0 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400">
                {headerBadge}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {banner}
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DraftTypeSelector({ currentType }: { currentType: DraftTypeKey }) {
  const roles = useAuthStore((state) => state.roles)
  const visibleTypes = DRAFT_TYPES.filter(
    (type) => !type.minRole || hasRequiredRole(roles, type.minRole),
  )

  return (
    <Card className="h-fit rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="text-base font-bold">기안서 종류</CardTitle>
      </CardHeader>
      <CardContent>
        <nav aria-label="기안서 종류 선택" className="flex flex-col gap-1">
          {visibleTypes.map((type) => {
            const TypeIcon = type.icon
            const active = type.key === currentType
            return (
              <Link
                key={type.key}
                to={type.route}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-3 transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    active
                      ? 'bg-background text-primary shadow-sm'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <TypeIcon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{type.label}</span>
                  <span
                    className={cn(
                      'truncate text-xs font-normal',
                      active ? 'text-primary/70' : 'text-muted-foreground',
                    )}
                  >
                    {type.description}
                  </span>
                </span>
                {active && <Check className="ml-auto size-4 shrink-0" />}
              </Link>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function DraftAttachmentsCard({
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
    <Card className="rounded-2xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Paperclip className="size-4 text-muted-foreground" />
          첨부파일
        </CardTitle>
        <CardAction>
          <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
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
            event.target.value = ''
          }}
        />
        {attachments.length === 0 ? (
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-4 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <FileUp className="size-6" />
            <p className="text-xs">파일을 드래그하거나 선택하세요</p>
          </label>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {attachments.map((file) => {
              const extension = file.name.includes('.')
                ? file.name.split('.').pop()?.toUpperCase()
                : 'FILE'
              return (
                <li
                  key={`${file.name}-${file.size}`}
                  className="flex items-center gap-2 rounded-xl bg-muted/50 p-2.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
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
                    className="shrink-0 text-muted-foreground hover:text-destructive"
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
