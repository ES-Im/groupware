import { useEffect, useId, useState } from 'react'
import dayjs from 'dayjs'
import { Paperclip, Search, Send, Trash2, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { handleApiError } from '@/shared/lib/apiError'
import { usePageState } from '@/shared/lib/usePageState'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'
import { useDeleteDraftMutation } from '../api/useDeleteDraftMutation'
import { useMessageDeleteMutation } from '../api/useMessageDeleteMutation'
import { useMessageRestoreMutation } from '../api/useMessageRestoreMutation'
import { useMessagesQuery } from '../api/useMessagesQuery'
import { useMessageTrashMutation } from '../api/useMessageTrashMutation'
import { useSendDraftMutation } from '../api/useSendDraftMutation'
import type { MailBox, MessagesResponse } from '../model/messageTypes'

const SEARCH_DEBOUNCE_MS = 300

type ReadFilter = 'all' | 'read' | 'unread'

const READ_FILTERS: { value: ReadFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'read', label: '읽음' },
  { value: 'unread', label: '안읽음' },
]

const EMPTY_MESSAGES: Record<MailBox, string> = {
  received: '받은 쪽지가 없습니다.',
  sent: '보낸 쪽지가 없습니다.',
  drafts: '임시보관된 쪽지가 없습니다.',
  trash: '휴지통이 비어 있습니다.',
}

function formatMessageDateTime(value: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function formatCounterpart(box: MailBox, row: MessagesResponse): string {
  if (box === 'sent') {
    if (!row.representativeReceiverName) {
      return '-'
    }
    return row.receiverCount > 1
      ? `${row.representativeReceiverName} 외 ${row.receiverCount - 1}명`
      : row.representativeReceiverName
  }
  return row.senderDeptName ? `${row.senderDeptName} ${row.senderName}` : row.senderName
}

function counterpartAvatarName(box: MailBox, row: MessagesResponse): string {
  if (box === 'sent') {
    return row.representativeReceiverName ?? '쪽'
  }
  return row.senderName
}

interface MessageRowActions {
  onTrash: (params: { messageId: number; isSentByMe: boolean }) => void
  onRestore: (params: { messageId: number; isSentByMe: boolean }) => void
  onDelete: (params: { messageId: number; isSentByMe: boolean }) => void
  onSendDraft: (messageId: number) => void
  onDeleteDraft: (messageId: number) => void
}

function MessageRowActionButtons({
  box,
  row,
  actions,
}: {
  box: MailBox
  row: MessagesResponse
  actions: MessageRowActions
}) {
  const { messageId, isSentByMe } = row

  if (box === 'drafts') {
    return (
      <div
        className="flex items-center gap-0.5"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="발송"
          onClick={() => actions.onSendDraft(messageId)}
        >
          <Send />
          <span className="sr-only">발송</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" title="삭제">
              <Trash2 />
              <span className="sr-only">삭제</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>이 임시 쪽지를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                삭제된 쪽지는 휴지통을 거치지 않고 즉시 삭제되며 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => actions.onDeleteDraft(messageId)}>
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  if (box === 'trash') {
    return (
      <div
        className="flex items-center gap-0.5"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="복구"
          onClick={() => actions.onRestore({ messageId, isSentByMe })}
        >
          <Undo2 />
          <span className="sr-only">복구</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" title="완전 삭제">
              <X />
              <span className="sr-only">완전 삭제</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>쪽지를 완전 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>삭제한 쪽지는 복구할 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => actions.onDelete({ messageId, isSentByMe })}>
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="휴지통 이동"
      onClick={(event) => {
        event.stopPropagation()
        actions.onTrash({ messageId, isSentByMe })
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Trash2 />
      <span className="sr-only">휴지통 이동</span>
    </Button>
  )
}

function MessageRow({
  box,
  row,
  onActivate,
  actions,
}: {
  box: MailBox
  row: MessagesResponse
  onActivate: () => void
  actions: MessageRowActions
}) {
  const isUnread = box === 'received' && row.isRead === false
  const avatarName = counterpartAvatarName(box, row)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onActivate()
        }
      }}
      className={cn(
        'group relative flex w-full cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none',
        isUnread && 'bg-primary/[0.04]',
      )}
    >
      {isUnread && (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" aria-hidden="true" />
      )}
      <BlobAvatar
        empId={undefined}
        fileId={undefined}
        fallbackText={avatarName}
        className="size-9 shrink-0"
      />
      <div className="w-32 shrink-0 sm:w-44">
        <p
          className={cn(
            'truncate text-sm text-foreground',
            isUnread ? 'font-bold' : 'font-semibold',
          )}
        >
          {formatCounterpart(box, row)}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm text-foreground',
            isUnread ? 'font-bold' : 'font-medium',
          )}
        >
          {row.title}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          {isUnread && (
            <span className="size-1.5 rounded-full bg-primary" aria-label="읽지 않음" />
          )}
          <time className="text-xs whitespace-nowrap text-muted-foreground">
            {formatMessageDateTime(row.sentAt)}
          </time>
        </div>
        <div className="flex items-center gap-1">
          {row.fileCount > 0 && (
            <span
              className="inline-flex items-center text-muted-foreground"
              aria-label={`첨부 ${row.fileCount}개`}
            >
              <Paperclip className="size-3.5" aria-hidden="true" />
            </span>
          )}
          <MessageRowActionButtons box={box} row={row} actions={actions} />
        </div>
      </div>
    </div>
  )
}

interface MessageBoxTableProps {
  box: MailBox
  onOpenDetail: (messageId: number) => void
  onOpenCompose: (messageId?: number, isEdit?: boolean) => void
}

export function MessageBoxTable({ box, onOpenDetail, onOpenCompose }: MessageBoxTableProps) {
  const searchInputId = useId()
  const [searchValue, setSearchValue] = useState('')
  const [keyword, setKeyword] = useState('')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const { page, size, onPageChange, resetPage } = usePageState()
  const trashMutation = useMessageTrashMutation()
  const restoreMutation = useMessageRestoreMutation()
  const deleteMutation = useMessageDeleteMutation()
  const sendDraftMutation = useSendDraftMutation()
  const deleteDraftMutation = useDeleteDraftMutation()

  const [prevBox, setPrevBox] = useState(box)
  if (prevBox !== box) {
    setPrevBox(box)
    setSearchValue('')
    setKeyword('')
    setReadFilter('all')
    resetPage()
  }

  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => {
      setKeyword(trimmed)
      resetPage()
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchValue, keyword, resetPage])

  const isReadParam =
    box === 'received' && readFilter !== 'all' ? readFilter === 'read' : undefined
  const listQuery = useMessagesQuery(box, {
    keyword,
    page,
    size,
    ...(isReadParam != null ? { isRead: isReadParam } : {}),
  })

  useEffect(() => {
    if (!listQuery.error) {
      return
    }
    handleApiError(listQuery.error, { toast })
  }, [listQuery.error])

  const rowActions: MessageRowActions = {
    onTrash: trashMutation.mutate,
    onRestore: restoreMutation.mutate,
    onDelete: deleteMutation.mutate,
    onSendDraft: (messageId) =>
      sendDraftMutation.mutate(messageId, {
        onError: (error) => handleApiError(error, { toast }),
      }),
    onDeleteDraft: (messageId) =>
      deleteDraftMutation.mutate(
        { messageId },
        { onError: (error) => handleApiError(error, { toast }) },
      ),
  }

  const rows = listQuery.data?.content ?? []

  const pageInfo: PageMeta = listQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const isPlaceholder = listQuery.isPlaceholderData

  function handleReadFilterChange(next: ReadFilter) {
    if (next === readFilter) {
      return
    }
    setReadFilter(next)
    resetPage()
  }

  function handleRowActivate(row: MessagesResponse) {
    if (isPlaceholder) {
      return
    }
    if (box === 'drafts') {
      onOpenCompose(row.messageId, true)
    } else {
      onOpenDetail(row.messageId)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor={searchInputId} className="sr-only">
            쪽지 검색
          </label>
          <Input
            id={searchInputId}
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="제목/내용/발신자 검색"
            className="rounded-xl pl-8"
          />
        </div>
        {box === 'received' && (
          <div
            className="flex items-center gap-1 rounded-xl bg-muted p-1"
            role="group"
            aria-label="읽음 상태 필터"
          >
            {READ_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={filter.value === readFilter}
                onClick={() => handleReadFilterChange(filter.value)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  filter.value === readFilter
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        aria-busy={isPlaceholder || undefined}
        className={cn(
          'flex-1 overflow-hidden rounded-xl border border-border transition-opacity',
          isPlaceholder && 'pointer-events-none opacity-50',
        )}
      >
        {listQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : listQuery.error ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            목록을 불러오지 못했습니다.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{EMPTY_MESSAGES[box]}</p>
        ) : (
          <div>
            {rows.map((row) => (
              <MessageRow
                key={row.messageId}
                box={box}
                row={row}
                onActivate={() => handleRowActivate(row)}
                actions={rowActions}
              />
            ))}
          </div>
        )}
      </div>

      <PaginationControls
        className="border-t pt-4"
        pageInfo={pageInfo}
        page={page}
        onPageChange={onPageChange}
        unit="건"
      />
    </div>
  )
}
