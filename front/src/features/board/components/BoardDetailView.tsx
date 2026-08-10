import {useEffect} from 'react'
import {Link, useNavigate} from 'react-router'
import {Download, Eye, Heart, MessageCircle, Paperclip, Pencil, Send, Trash2} from 'lucide-react'
import dayjs from 'dayjs'
import {toast} from 'sonner'
import {useAuthStore} from '@/features/auth/store/authStore'
import {isForbidden, isNotFound, normalizeApiError} from '@/shared/lib/apiError'
import {hasRequiredRole} from '@/shared/lib/hasRequiredRole'
import {cn} from '@/shared/lib/utils'
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
import {Button} from '@/shared/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/shared/ui/card'
import {Separator} from '@/shared/ui/separator'
import {useCategoriesQuery} from '@/features/category/api/useCategoriesQuery'
import {useMeQuery} from '@/features/employee/api/useMeQuery'
import {downloadBoardFile} from '../api/downloadBoardFile'
import {useBoardDeleteMutation} from '../api/useBoardDeleteMutation'
import {useBoardDetailQuery} from '../api/useBoardDetailQuery'
import {useBoardFilePreviewUrl} from '../api/useBoardFilePreviewUrl'
import {useBoardFilesQuery} from '../api/useBoardFilesQuery'
import {useBoardLikeMutation} from '../api/useBoardLikeMutation'
import {useBoardPublishMutation} from '../api/useBoardPublishMutation'
import {isImageExtension} from '../lib/isImageExtension'
import type {BoardFileInfo} from '../model/board'
import {CategoryBadge} from './CategoryBadge'
import {CommentSection} from './CommentSection'

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function BoardFileCard({ file, onDownload }: { file: BoardFileInfo; onDownload: () => void }) {
  return (
    <div className="flex min-w-56 items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <span className="rounded-md bg-primary/10 px-1.5 py-1 text-[10px] font-bold text-primary uppercase">
        {file.extension || '파일'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.originalName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDownload}
        aria-label={`${file.originalName} 다운로드`}
      >
        <Download />
      </Button>
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye
  label: string
  value: number
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4" />
      <span className="sr-only">{label}</span>
      {value.toLocaleString()}
    </span>
  )
}

function LikeToggleButton({
  isLiked,
  likeCount,
  onToggleLike,
  isPending,
}: {
  isLiked: boolean
  likeCount: number
  onToggleLike: () => void
  isPending: boolean
}) {
  return (
    <Button
      type="button"
      size="lg"
      variant={isLiked ? 'default' : 'outline'}
      onClick={onToggleLike}
      disabled={isPending}
      aria-pressed={isLiked}
      aria-label={`좋아요 ${likeCount.toLocaleString()}개${isLiked ? ' (누름)' : ''}`}
      className="rounded-full px-5"
    >
      <Heart className={cn('size-4', isLiked && 'fill-current')} aria-hidden="true" />
      좋아요 {likeCount.toLocaleString()}
    </Button>
  )
}

function BoardImagePreview({
  boardId,
  file,
}: {
  boardId: number
  file: BoardFileInfo
}) {
  const { objectUrl, isLoading, isError } = useBoardFilePreviewUrl(boardId, file.fileId)

  if (isLoading) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  if (isError || !objectUrl) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        이미지를 불러오지 못했습니다.
      </div>
    )
  }

  return (
    <img
      src={objectUrl}
      alt={file.originalName}
      className="max-h-80 w-auto max-w-full rounded-lg border object-contain"
    />
  )
}

interface BoardDetailViewProps {
  boardId: number
  inline?: boolean
  onDeleted?: () => void
}

export function BoardDetailView({ boardId, inline, onDeleted }: BoardDetailViewProps) {
  const navigate = useNavigate()
  const roles = useAuthStore((state) => state.roles)
  const isAdmin = hasRequiredRole(roles, 'ADMIN')
  const myEmpId = useMeQuery().data?.empBasicInfo.empId

  const detailQuery = useBoardDetailQuery(boardId)
  const filesQuery = useBoardFilesQuery(boardId)
  const publishMutation = useBoardPublishMutation()
  const deleteMutation = useBoardDeleteMutation()
  const likeMutation = useBoardLikeMutation(boardId)

  const categoriesQuery = useCategoriesQuery()

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  useEffect(() => {
    if (!filesQuery.error) {
      return
    }
    toast.error(normalizeApiError(filesQuery.error).message)
  }, [filesQuery.error])

  function handleDownload(file: BoardFileInfo) {
    downloadBoardFile(boardId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  function handlePublish() {
    publishMutation.mutate(boardId, {
      onSuccess: () => {
        toast.success('게시글을 발행했습니다')
      },
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  function handleDelete() {
    deleteMutation.mutate(boardId, {
      onSuccess: () => {
        toast.success('게시글을 삭제했습니다')
        if (onDeleted) {
          onDeleted()
        } else {
          navigate('/boards')
        }
      },
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">게시글을 불러오는 중...</p>
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return (
        <>
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
          <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        </>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <>
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
          <p className="text-sm text-muted-foreground">이 게시글을 조회할 권한이 없습니다.</p>
        </>
      )
    }
    return (
      <>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 상세</h1>
        <p className="text-sm text-muted-foreground">게시글을 불러오지 못했습니다.</p>
      </>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const board = detailQuery.data
  const canEdit = isAdmin || (myEmpId != null && myEmpId === board.empId)
  const files = filesQuery.data ?? []
  const showModifiedAt = board.modifiedAt && board.modifiedAt !== board.publishedAt
  const categoryName = categoriesQuery.data?.find(
    (category) => category.categoryId === board.categoryId,
  )?.categoryName

  const cardHeader = (
    <CardHeader className="border-b">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {categoryName && <CategoryBadge name={categoryName} className="mb-2" />}
          <CardTitle className="text-xl font-bold tracking-tight break-all text-foreground">
            {board.title}
          </CardTitle>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/boards/${boardId}/edit`}>
                <Pencil />
                수정
              </Link>
            </Button>
          )}
          {canEdit && board.isDraft && (
            <Button size="sm" disabled={publishMutation.isPending} onClick={handlePublish}>
              <Send />
              발행
            </Button>
          )}
          {canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 />
                  삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>게시글을 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    삭제한 게시글은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </CardHeader>
  )

  const isLiked = board.isLiked
  const isLikePending = likeMutation.isPending
  const handleToggleLike = () => {
    likeMutation.mutate(board.isLiked, {
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  const cardBody = (
    <CardContent className="flex flex-1 flex-col gap-4">
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-muted-foreground">작성자</span>
          <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
            {board.authorName}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <p className="text-xs text-muted-foreground tabular-nums">
            발행 {dayjs(board.publishedAt).format('YYYY-MM-DD HH:mm')}
            {showModifiedAt && ` · 수정 ${dayjs(board.modifiedAt).format('YYYY-MM-DD HH:mm')}`}
          </p>
          <div className="flex items-center gap-4">
            <StatPill icon={Eye} label="조회수" value={board.viewCount} />
            <StatPill icon={MessageCircle} label="댓글 수" value={board.commentCount} />
          </div>
        </div>
      </div>

      <Separator />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">내용</h3>
        <p className="min-h-24 text-sm leading-7 whitespace-pre-wrap break-words text-foreground">
          {board.content}
        </p>
      </section>

      {filesQuery.isLoading ? (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
        </>
      ) : files.length > 0 ? (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Paperclip className="size-4" />
              첨부파일 {files.length}개
            </h3>
            <div className="flex flex-wrap gap-3">
              {files.map((file) =>
                isImageExtension(file.extension) ? (
                  <BoardImagePreview key={file.fileId} boardId={boardId} file={file} />
                ) : (
                  <BoardFileCard
                    key={file.fileId}
                    file={file}
                    onDownload={() => handleDownload(file)}
                  />
                ),
              )}
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-auto flex justify-center border-t pt-4">
        <LikeToggleButton
          isLiked={isLiked}
          likeCount={board.likeCount}
          onToggleLike={handleToggleLike}
          isPending={isLikePending}
        />
      </div>
    </CardContent>
  )

  if (inline) {
    return (
      <div className="flex flex-col">
        <Card className="flex flex-col">
          {cardHeader}
          <div className="flex flex-col">{cardBody}</div>
          <div className="flex flex-col lg:min-h-72">
            <CommentSection boardId={boardId} variant="embedded" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      {cardHeader}
      {cardBody}
      <CommentSection boardId={boardId} variant="embedded" />
    </Card>
  )
}
