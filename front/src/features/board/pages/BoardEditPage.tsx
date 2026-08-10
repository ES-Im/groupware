import {useEffect} from 'react'
import {useNavigate, useParams} from 'react-router'
import {useQueryClient} from '@tanstack/react-query'
import {SquarePen} from 'lucide-react'
import dayjs from 'dayjs'
import {toast} from 'sonner'
import {isForbidden, isNotFound, normalizeApiError} from '@/shared/lib/apiError'
import {Card, CardContent, CardHeader, CardTitle} from '@/shared/ui/card'
import {useCategoriesQuery} from '@/features/category/api/useCategoriesQuery'
import {useBoardDetailQuery} from '../api/useBoardDetailQuery'
import {useBoardEditModeQuery} from '../api/useBoardEditModeQuery'
import {useBoardPublishMutation} from '../api/useBoardPublishMutation'
import {useBoardUpdateMutation} from '../api/useBoardUpdateMutation'
import {boardKeys} from '../model/queryKeys'
import {BoardEditAttachments} from '../components/BoardEditAttachments'
import {BoardEditForm} from '../components/BoardEditForm'
import type {BoardUpdateRequest} from '../model/board'

export function BoardEditPage() {
  const { boardId: boardIdParam } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isDecimalPositiveInteger = boardIdParam !== undefined && /^[1-9][0-9]*$/.test(boardIdParam)
  const boardId = isDecimalPositiveInteger ? Number(boardIdParam) : undefined
  const isInvalidBoardId = boardId === undefined

  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const editModeQuery = useBoardEditModeQuery(isInvalidBoardId ? undefined : boardId)
  const detailQuery = useBoardDetailQuery(
    isInvalidBoardId || !editModeQuery.isSuccess ? undefined : boardId,
  )
  const updateMutation = useBoardUpdateMutation()
  const publishMutation = useBoardPublishMutation()

  useEffect(() => {
    if (!categoriesQuery.error) {
      return
    }
    toast.error(normalizeApiError(categoriesQuery.error).message)
  }, [categoriesQuery.error])

  useEffect(() => {
    if (!editModeQuery.error) {
      return
    }
    const apiError = normalizeApiError(editModeQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [editModeQuery.error])

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  function getModifiedAt(): string | undefined {
    if (!detailQuery.data) {
      return undefined
    }
    return detailQuery.data.modifiedAt ?? dayjs().format('YYYY-MM-DDTHH:mm:ss')
  }

  function resolveEditTargetPath(): string {
    if (detailQuery.data?.isDraft) {
      return '/boards'
    }
    if (detailQuery.error && isNotFound(normalizeApiError(detailQuery.error))) {
      return '/boards'
    }
    return `/boards/${boardId}`
  }

  async function handleSubmitPayload(payload: BoardUpdateRequest) {
    if (boardId === undefined) {
      return
    }
    await updateMutation.mutateAsync({ boardId, payload })
    toast.success('게시글을 수정했습니다')
    navigate(resolveEditTargetPath())
  }

  function handlePublish() {
    if (boardId === undefined) {
      return
    }
    publishMutation.mutate(boardId, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: boardKeys.all })
        toast.success('게시글을 발행했습니다')
        navigate('/boards')
      },
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  if (isInvalidBoardId) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
        <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (editModeQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (editModeQuery.error) {
    const apiError = normalizeApiError(editModeQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
          <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        </div>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
          <p className="text-sm text-muted-foreground">이 게시글을 수정할 권한이 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
        <p className="text-sm text-muted-foreground">게시글을 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!editModeQuery.data || boardId === undefined) {
    return null
  }

  if (categoriesQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  const editMode = editModeQuery.data

  return (
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">게시글 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">카테고리·제목·본문을 수정한 뒤 저장합니다.</p>
      </div>

      <Card className="flex flex-col lg:min-h-0 lg:flex-1">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            게시글 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <BoardEditForm
            cancel={{ type: 'link', path: resolveEditTargetPath() }}
            categories={categories}
            defaultValues={{
              categoryId: String(editMode.categoryId),
              title: editMode.title,
              content: editMode.content,
            }}
            attachmentsSlot={<BoardEditAttachments boardId={boardId} flat />}
            getModifiedAt={getModifiedAt}
            isModifiedAtReady={getModifiedAt() !== undefined}
            onSubmitPayload={handleSubmitPayload}
            publish={
              detailQuery.data?.isDraft
                ? { onClick: handlePublish, isPending: publishMutation.isPending }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
