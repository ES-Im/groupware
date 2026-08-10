import {useEffect, useRef, useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {FileClock, FileText, Paperclip, Plus, Save, Send, X} from 'lucide-react'
import dayjs from 'dayjs'
import {toast} from 'sonner'
import {isForbidden, isNotFound, normalizeApiError} from '@/shared/lib/apiError'
import {submitWithErrorMapping, useZodForm} from '@/shared/lib/form'
import {Button} from '@/shared/ui/button'
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@/shared/ui/hover-card'
import {Input} from '@/shared/ui/input'
import {Label} from '@/shared/ui/label'
import {Textarea} from '@/shared/ui/textarea'
import {useCategoriesQuery} from '@/features/category/api/useCategoriesQuery'
import {useBoardDetailQuery} from '../api/useBoardDetailQuery'
import {useBoardDraftsQuery} from '../api/useBoardDraftsQuery'
import {useBoardEditModeQuery} from '../api/useBoardEditModeQuery'
import {useBoardPublishMutation} from '../api/useBoardPublishMutation'
import {useBoardRegisterMutation} from '../api/useBoardRegisterMutation'
import {useBoardUpdateMutation} from '../api/useBoardUpdateMutation'
import {BoardFileValidationError, validateBoardFileUpload} from '../lib/fileValidation'
import {type BoardCreateFormValues, boardCreateSchema} from '../model/boardCreateSchema'
import {boardKeys} from '../model/queryKeys'
import type {BoardUpdateRequest} from '../model/board'
import {BoardEditAttachments} from './BoardEditAttachments'
import {BoardEditForm} from './BoardEditForm'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncateDraftTitle(title: string): string {
  const maxLength = 10
  return title.length > maxLength ? `${title.slice(0, maxLength)}…` : title
}

interface BoardCreateFormProps {
  onSuccess: () => void
  defaultCategoryId?: number
}

export function BoardCreateForm({ onSuccess, defaultCategoryId }: BoardCreateFormProps) {
  const queryClient = useQueryClient()
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const [editingBoardId, setEditingBoardId] = useState<number | undefined>(undefined)

  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const draftsQuery = useBoardDraftsQuery()
  const drafts = draftsQuery.data ?? []

  const registerMutation = useBoardRegisterMutation()

  const editModeQuery = useBoardEditModeQuery(editingBoardId)
  const detailQuery = useBoardDetailQuery(editModeQuery.isSuccess ? editingBoardId : undefined)
  const updateMutation = useBoardUpdateMutation()
  const publishMutation = useBoardPublishMutation()

  const form = useZodForm(boardCreateSchema, {
    defaultValues: { categoryId: '', title: '', content: '' },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (!categoriesQuery.error) {
      return
    }
    toast.error(normalizeApiError(categoriesQuery.error).message)
  }, [categoriesQuery.error])

  const appliedDefaultCategoryRef = useRef(false)
  useEffect(() => {
    if (appliedDefaultCategoryRef.current) {
      return
    }
    const initialCategoryId = defaultCategoryId ?? categories[0]?.categoryId
    if (initialCategoryId === undefined) {
      return
    }
    form.setValue('categoryId', String(initialCategoryId))
    appliedDefaultCategoryRef.current = true
  }, [defaultCategoryId, categories, form])

  useEffect(() => {
    if (!isDraftsOpen || !draftsQuery.error) {
      return
    }
    toast.error(normalizeApiError(draftsQuery.error).message)
  }, [isDraftsOpen, draftsQuery.error])

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

  async function submit(values: BoardCreateFormValues, options: { publish: boolean }) {
    await registerMutation.mutateAsync({
      categoryId: Number(values.categoryId),
      title: values.title,
      content: values.content,
      publishedAt: options.publish ? dayjs().format('YYYY-MM-DDTHH:mm:ss') : undefined,
    })
    toast.success(options.publish ? '게시글을 발행했습니다' : '게시글을 임시저장했습니다')
    setStagedFiles([])
    onSuccess()
  }

  function handleStagedFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    const combined = [...stagedFiles, ...selected]
    try {
      validateBoardFileUpload(combined, [])
    } catch (error) {
      if (error instanceof BoardFileValidationError) {
        toast.error(error.message)
        return
      }
      throw error
    }
    setStagedFiles(combined)
  }

  function handleRemoveStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const submitDraft = submitWithErrorMapping(form, (values) => submit(values, { publish: false }))
  const submitPublish = submitWithErrorMapping(form, (values) => submit(values, { publish: true }))

  function handleSelectDraft(boardId: number) {
    setEditingBoardId(boardId)
  }

  async function handleEditSubmit(payload: BoardUpdateRequest) {
    if (editingBoardId === undefined) {
      return
    }
    await updateMutation.mutateAsync({ boardId: editingBoardId, payload })
    toast.success('게시글을 수정했습니다')
    setEditingBoardId(undefined)
    onSuccess()
  }

  function handlePublish() {
    if (editingBoardId === undefined) {
      return
    }
    publishMutation.mutate(editingBoardId, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: boardKeys.all })
        toast.success('게시글을 발행했습니다')
        setEditingBoardId(undefined)
        onSuccess()
      },
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  if (editingBoardId !== undefined) {
    if (editModeQuery.isLoading || categoriesQuery.isLoading) {
      return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
    }
    if (editModeQuery.error || !editModeQuery.data) {
      return (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">임시저장글을 불러오지 못했습니다.</p>
          <Button type="button" variant="outline" onClick={() => setEditingBoardId(undefined)}>
            돌아가기
          </Button>
        </div>
      )
    }

    const editMode = editModeQuery.data
    return (
      <BoardEditForm
        key={editingBoardId}
        cancel={{ type: 'button', onClick: () => setEditingBoardId(undefined) }}
        categories={categories}
        defaultValues={{
          categoryId: String(editMode.categoryId),
          title: editMode.title,
          content: editMode.content,
        }}
        attachmentsSlot={<BoardEditAttachments boardId={editingBoardId} flat />}
        getModifiedAt={getModifiedAt}
        isModifiedAtReady={getModifiedAt() !== undefined}
        onSubmitPayload={handleEditSubmit}
        publish={
          detailQuery.data?.isDraft
            ? { onClick: handlePublish, isPending: publishMutation.isPending }
            : undefined
        }
      />
    )
  }

  return (
    <form
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-1 flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="board-category" className="shrink-0">
          카테고리 <span className="text-destructive">*</span>
        </Label>
        <select
          id="board-category"
          aria-invalid={!!errors.categoryId}
          disabled={categories.length === 0}
          className="h-8 w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('categoryId')}
        >
          <option value="">카테고리 선택</option>
          {categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p role="alert" className="w-full text-sm text-destructive">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="board-title">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="board-title"
          placeholder="제목을 입력해주세요"
          maxLength={50}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="board-content">
          본문 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="board-content"
          placeholder="본문을 입력해주세요"
          className="min-h-48 flex-1 resize-y"
          aria-invalid={!!errors.content}
          {...register('content')}
        />
        {errors.content && (
          <p role="alert" className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>첨부파일</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleStagedFileInputChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus />
          파일 추가
        </Button>
        {stagedFiles.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {stagedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 truncate text-sm text-foreground">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                  {file.name}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatFileSizeMb(file.size)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveStagedFile(index)}
                    aria-label={`${file.name} 제거`}
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">선택된 첨부파일이 없습니다.</p>
        )}
        <p className="text-xs text-muted-foreground">
          선택한 파일은 게시글을 저장한 뒤 "임시저장글" 목록에서 열어 첨부할 수 있습니다.
        </p>
      </div>

      <div className="mt-2 flex flex-col-reverse gap-3 rounded-xl border bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <HoverCard openDelay={100} closeDelay={150} onOpenChange={setIsDraftsOpen}>
          <HoverCardTrigger asChild>
            <Button type="button" variant="secondary">
              <FileClock />
              임시저장글 불러오기
            </Button>
          </HoverCardTrigger>
          <HoverCardContent side="top" align="start" className="w-80 overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>제목</span>
              <span>작성일시</span>
            </div>
            {draftsQuery.isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">불러오는 중...</p>
            ) : drafts.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                임시저장한 글이 없습니다.
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto py-1">
                {drafts.map((draft) => (
                  <li key={draft.boardId}>
                    <button
                      type="button"
                      onClick={() => handleSelectDraft(draft.boardId)}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{truncateDraftTitle(draft.title)}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {dayjs(draft.updatedAt).format('YY-MM-DD HH:mm')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </HoverCardContent>
        </HoverCard>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => void submitDraft()}
          >
            <Save />
            임시저장
          </Button>
          <Button
            type="button"
            className="font-semibold"
            disabled={isSubmitting}
            onClick={() => void submitPublish()}
          >
            <Send />
            발행
          </Button>
        </div>
      </div>
    </form>
  )
}
