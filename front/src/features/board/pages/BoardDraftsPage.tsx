import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Archive, FileText, Inbox, Send } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { boardKeys } from '../model/queryKeys'
import { useBoardDraftsQuery } from '../api/useBoardDraftsQuery'
import { useBoardPublishMutation } from '../api/useBoardPublishMutation'

export function BoardDraftsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const draftsQuery = useBoardDraftsQuery()
  const drafts = draftsQuery.data ?? []
  const publishMutation = useBoardPublishMutation()

  useEffect(() => {
    if (!draftsQuery.error) {
      return
    }
    toast.error(normalizeApiError(draftsQuery.error).message)
  }, [draftsQuery.error])

  function handleRowClick(boardId: number) {
    navigate(`/boards/${boardId}/edit`)
  }

  function handlePublish(boardId: number) {
    publishMutation.mutate(boardId, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: boardKeys.all })
        toast.success('게시글을 발행했습니다')
      },
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">임시저장함</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <Archive className="size-4" />
            내 임시저장 글
          </CardTitle>
          <CardDescription>제목을 눌러 이어서 작성하거나, 바로 발행할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {draftsQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : draftsQuery.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              임시저장 글 목록을 불러오지 못했습니다.
            </p>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">임시저장한 글이 없습니다.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {drafts.map((draft) => {
                const isPublishingThis =
                  publishMutation.isPending && publishMutation.variables === draft.boardId

                return (
                  <li key={draft.boardId} className="flex items-center gap-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleRowClick(draft.boardId)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{draft.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {dayjs(draft.updatedAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </span>
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPublishingThis}
                      onClick={() => handlePublish(draft.boardId)}
                    >
                      <Send />
                      발행
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
