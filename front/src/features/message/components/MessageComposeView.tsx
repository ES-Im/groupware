import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowLeft,
  Download,
  FileText,
  FileUp,
  Loader2,
  Paperclip,
  Plus,
  Save,
  Send,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmployeePicker, type EmployeePickerEmployee } from '@/shared/components/EmployeePicker'
import { normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { downloadMessageFile } from '../api/downloadMessageFile'
import type { MessageCreateRequest } from '../api/sendMessage'
import { useCreateDraftMutation } from '../api/useCreateDraftMutation'
import { useDeleteMessageFileMutation } from '../api/useDeleteMessageFileMutation'
import { useMessageDetailQuery } from '../api/useMessageDetailQuery'
import { useMessageDraftReceiversUpdateMutation } from '../api/useMessageDraftReceiversUpdateMutation'
import { useMessageDraftUpdateMutation } from '../api/useMessageDraftUpdateMutation'
import { useMessageFilesQuery } from '../api/useMessageFilesQuery'
import { useSendDraftMutation } from '../api/useSendDraftMutation'
import { useSendMessageMutation } from '../api/useSendMessageMutation'
import { useUploadMessageFilesMutation } from '../api/useUploadMessageFilesMutation'
import { MessageFileValidationError, validateMessageFileUpload } from '../lib/messageFileValidation'
import { isMessageImageExtension } from '../lib/messageImageExtension'
import { messageDraftSchema } from '../model/messageDraftSchema'
import type { FileListInfo } from '../model/messageTypes'
import { MessageFilePreviewDialog } from './MessageFilePreviewDialog'

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export interface MessageComposeInitialValues {
  receiverId: number
  receiverName: string
  title: string
  quotedContent?: string
}

function buildQuotedContent(quoted?: string): string {
  return quoted ? `\n\n----- 원본 메시지 -----\n${quoted}` : ''
}

function DeletableFileItem({ messageId, file }: { messageId: number; file: FileListInfo }) {
  const deleteMutation = useDeleteMessageFileMutation()
  const isImage = isMessageImageExtension(file.extension)

  function handleDelete() {
    deleteMutation.mutate(
      { messageId, fileId: file.fileId },
      {
        onSuccess: () => toast.success('첨부파일을 삭제했습니다'),
        onError: (error) => toast.error(normalizeApiError(error).message),
      },
    )
  }

  function handleDownload() {
    downloadMessageFile(messageId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border p-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileText className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" title={file.originalName}>
          {file.originalName}
        </span>
        <span className="block text-xs text-muted-foreground">
          {file.extension.toUpperCase()} · {formatFileSize(file.fileSize)}
        </span>
      </span>
      {isImage && <MessageFilePreviewDialog messageId={messageId} file={file} compact />}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        onClick={handleDownload}
        aria-label={`${file.originalName} 다운로드`}
      >
        <Download />
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        className="shrink-0"
        disabled={deleteMutation.isPending}
        onClick={handleDelete}
        aria-label={`${file.originalName} 삭제`}
      >
        {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </Button>
    </li>
  )
}

function EditableAttachmentSection({
  messageId,
  files,
}: {
  messageId: number
  files: FileListInfo[]
}) {
  const uploadMutation = useUploadMessageFilesMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reportUploadError(error: unknown) {
    if (error instanceof MessageFileValidationError) {
      toast.error(error.message)
      return
    }
    toast.error(normalizeApiError(error).message)
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    const existingTotalSize = files.reduce((sum, file) => sum + file.fileSize, 0)
    try {
      validateMessageFileUpload(selected, existingTotalSize, files.length)
    } catch (error) {
      reportUploadError(error)
      return
    }
    uploadMutation.mutate(
      { messageId, files: selected },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        aria-label="쪽지 첨부파일"
        disabled={uploadMutation.isPending}
        onChange={handleFileInputChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-end"
        disabled={uploadMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
        {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
      </Button>
      {files.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-4 text-center text-muted-foreground">
          <FileUp className="size-6" />
          <p className="text-xs">첨부된 파일이 없습니다.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {files.map((file) => (
            <DeletableFileItem key={file.fileId} messageId={messageId} file={file} />
          ))}
        </ul>
      )}
    </div>
  )
}

interface MessageComposeViewProps {
  messageId?: number
  onBack: () => void
  initialValues?: MessageComposeInitialValues
  onSend?: () => void
  onDelete?: () => void
}

export function MessageComposeView({
  messageId,
  onBack,
  initialValues,
  onSend,
  onDelete,
}: MessageComposeViewProps) {
  const isEditMode = messageId != null
  const attachmentInputId = useId()
  const navigate = useNavigate()

  const form = useZodForm(messageDraftSchema, {
    defaultValues: {
      title: initialValues?.title ?? '',
      content: buildQuotedContent(initialValues?.quotedContent),
    },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  const [selectedEmployees, setSelectedEmployees] = useState<EmployeePickerEmployee[]>(() =>
    initialValues
      ? [{ empId: initialValues.receiverId, empName: initialValues.receiverName }]
      : [],
  )
  const [attachments, setAttachments] = useState<File[]>([])
  const [receiverDialogOpen, setReceiverDialogOpen] = useState(false)
  const [resumeMessageId, setResumeMessageId] = useState<number | undefined>(undefined)

  const sendMessageMutation = useSendMessageMutation()
  const createDraftMutation = useCreateDraftMutation()
  const uploadFilesMutation = useUploadMessageFilesMutation()
  const sendDraftMutation = useSendDraftMutation()
  const updateDraftMutation = useMessageDraftUpdateMutation()
  const updateReceiversMutation = useMessageDraftReceiversUpdateMutation()

  const detailQuery = useMessageDetailQuery(isEditMode ? messageId : undefined)
  const filesQuery = useMessageFilesQuery(isEditMode ? messageId : undefined)
  const prefilledRef = useRef(false)

  useEffect(() => {
    if (!isEditMode || prefilledRef.current || detailQuery.data == null) {
      return
    }
    const detail = detailQuery.data
    form.reset({ title: detail.title, content: detail.content })
    setSelectedEmployees(
      detail.receivers.map((receiver) => ({
        empId: receiver.receiverId,
        empName: receiver.receiverName,
      })),
    )
    prefilledRef.current = true
  }, [isEditMode, detailQuery.data, form])

  function addFiles(files: FileList | null) {
    if (!files) {
      return
    }
    const added = Array.from(files).filter(
      (file) => !attachments.some((item) => item.name === file.name && item.size === file.size),
    )
    if (added.length === 0) {
      return
    }
    const existingTotalSize = attachments.reduce((sum, file) => sum + file.size, 0)
    try {
      validateMessageFileUpload(added, existingTotalSize, attachments.length)
    } catch (error) {
      if (error instanceof MessageFileValidationError) {
        toast.error(error.message)
        return
      }
      throw error
    }
    setAttachments((prev) => [...prev, ...added])
  }

  function removeAttachment(file: File) {
    setAttachments((prev) => prev.filter((item) => item !== file))
  }

  async function ensureDraftMessageId(payload: MessageCreateRequest): Promise<number> {
    if (resumeMessageId != null) {
      return resumeMessageId
    }
    const { messageId: created } = await createDraftMutation.mutateAsync(payload)
    setResumeMessageId(created)
    return created
  }

  const handleSend = submitWithErrorMapping(form, async (values) => {
    const receiverIds = selectedEmployees.map((emp) => emp.empId)
    if (receiverIds.length === 0) {
      toast.error('받는 사람을 최소 1명 선택해주세요')
      return
    }

    if (attachments.length === 0) {
      await sendMessageMutation.mutateAsync({ ...values, receiverIds })
      toast.success('쪽지를 전송했습니다')
      onBack()
      navigate('/messages/sent')
      return
    }

    const id = await ensureDraftMessageId({ ...values, receiverIds })
    try {
      await uploadFilesMutation.mutateAsync({ messageId: id, files: attachments })
      await sendDraftMutation.mutateAsync(id)
    } catch (error) {
      toast.error('임시보관함에 저장되었습니다. 첨부/전송을 다시 시도해주세요.')
      throw error
    }
    toast.success('쪽지를 전송했습니다')
    onBack()
    navigate('/messages/sent')
  })

  const handleSaveDraft = submitWithErrorMapping(form, async (values) => {
    const receiverIds = selectedEmployees.map((emp) => emp.empId)
    const id = await ensureDraftMessageId({
      ...values,
      receiverIds: receiverIds.length > 0 ? receiverIds : undefined,
    })
    if (attachments.length > 0) {
      try {
        await uploadFilesMutation.mutateAsync({ messageId: id, files: attachments })
      } catch (error) {
        toast.error('임시보관함에 저장되었습니다. 첨부를 다시 시도해주세요.')
        throw error
      }
    }
    toast.success('임시보관함에 저장했습니다')
    onBack()
    navigate('/messages/drafts')
  })

  const handleSave = submitWithErrorMapping(form, async (values) => {
    if (messageId == null) {
      return
    }
    const receiverIds = selectedEmployees.map((emp) => emp.empId)
    const tasks: Promise<unknown>[] = []
    if (form.formState.dirtyFields.title || form.formState.dirtyFields.content) {
      tasks.push(
        updateDraftMutation.mutateAsync({
          messageId,
          payload: { title: values.title, content: values.content },
        }),
      )
    }
    tasks.push(updateReceiversMutation.mutateAsync({ messageId, receiverIds }))

    const results = await Promise.allSettled(tasks)
    const failed = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    if (failed) {
      throw failed.reason
    }
    toast.success('임시 쪽지를 저장했습니다')
  })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="xl:hidden">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft />
          목록으로
        </Button>
      </div>

      <Card className="flex min-h-0 min-w-0 flex-1 flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {isEditMode ? '쪽지 수정' : '새 쪽지 작성'}
          </CardTitle>
          <CardDescription className="text-xs">
            {isEditMode
              ? '임시 저장한 쪽지를 이어서 수정합니다.'
              : '여러 사원에게 동시에 쪽지를 보낼 수 있습니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <form
            noValidate
            onSubmit={isEditMode ? (event) => event.preventDefault() : handleSend}
            className="flex flex-1 flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>받는 사람</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiverDialogOpen(true)}
                >
                  <UserPlus />
                  수신자 선택
                </Button>
              </div>

              {selectedEmployees.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEmployees.map((emp) => (
                    <span
                      key={emp.empId}
                      className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs text-foreground"
                    >
                      {emp.empName}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEmployees((prev) =>
                            prev.filter((item) => item.empId !== emp.empId),
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`${emp.empName} 선택 해제`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  선택된 수신자가 없습니다. [수신자 선택]으로 추가해주세요.
                </p>
              )}

              <Dialog open={receiverDialogOpen} onOpenChange={setReceiverDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>수신자 선택</DialogTitle>
                    <DialogDescription>
                      부서를 선택하고 부서원을 검색해 수신자를 추가하세요. 여러 명을 선택할 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <EmployeePicker selected={selectedEmployees} onChange={setSelectedEmployees} />
                  <DialogFooter>
                    <Button type="button" onClick={() => setReceiverDialogOpen(false)}>
                      완료
                      {selectedEmployees.length > 0 ? ` (${selectedEmployees.length})` : ''}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="message-compose-title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="message-compose-title"
                placeholder="제목을 입력해주세요"
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
              <Label htmlFor="message-compose-content">
                내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message-compose-content"
                placeholder="내용을 입력해주세요"
                className="min-h-32 flex-1 resize-none"
                aria-invalid={!!errors.content}
                {...register('content')}
              />
              {errors.content && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-1.5">
                  <Paperclip className="size-4 text-muted-foreground" />
                  첨부파일
                </Label>
                {!isEditMode && (
                  <Button asChild variant="outline" size="sm">
                    <label htmlFor={attachmentInputId} className="cursor-pointer">
                      <Plus />
                      파일 추가
                    </label>
                  </Button>
                )}
              </div>
              {isEditMode && messageId != null ? (
                <EditableAttachmentSection messageId={messageId} files={filesQuery.data ?? []} />
              ) : (
                <>
                  <input
                    id={attachmentInputId}
                    type="file"
                    multiple
                    className="sr-only"
                    aria-label="쪽지 첨부파일"
                    onChange={(event) => {
                      addFiles(event.target.files)
                      event.target.value = ''
                    }}
                  />
                  {attachments.length === 0 ? (
                    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-4 text-center text-muted-foreground">
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
                              <span
                                className="block truncate text-sm font-medium"
                                title={file.name}
                              >
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
                              onClick={() => removeAttachment(file)}
                            >
                              <X />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="-mx-4 -mb-4 mt-auto flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
              {isEditMode ? (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isSubmitting}>
                        <Trash2 />
                        삭제
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
                        <AlertDialogAction onClick={() => onDelete?.()}>삭제</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => void handleSave()}
                  >
                    <Save />
                    저장
                  </Button>
                  <Button type="button" disabled={isSubmitting} onClick={() => onSend?.()}>
                    <Send />
                    발송
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => void handleSaveDraft()}
                  >
                    <Save />
                    임시저장
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    <Send />
                    전송
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
