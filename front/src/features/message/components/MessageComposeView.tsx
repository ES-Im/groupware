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
import { Card, CardContent } from '@/shared/ui/card'
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

/** 첨부파일 크기 표기(approval DraftAttachmentsCard formatFileSize 이식 — B/KB/MB 3단). */
function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

/** 답장 진입 시 프리필 값(ROADMAP(MESSAGE) T4.4). MessageBoxPage가 받은쪽지 상세의 발신자·제목·
 * 본문에서 구성해 넘긴다 — messageId(편집 모드)와는 상호 배타적(호출부 책임, 여기서 방어 안 함). */
export interface MessageComposeInitialValues {
  receiverId: number
  receiverName: string
  title: string
  quotedContent?: string
}

/** 답장 본문 인용 포맷("(필요 시 본문 인용)", PRD §지원 UI 답장). quotedContent 없으면 빈 문자열. */
function buildQuotedContent(quoted?: string): string {
  return quoted ? `\n\n----- 원본 메시지 -----\n${quoted}` : ''
}

/**
 * 첨부 1건의 삭제 버튼을 소유하는 하위 컴포넌트 — 파일마다 독립된 useDeleteMessageFileMutation
 * 인스턴스(=독립된 MutationObserver)를 갖는다. TanStack Query v5는 단일 mutation 인스턴스에
 * 동시 mutate() 호출이 겹치면 나중 호출이 앞선 호출의 per-call 콜백(onSuccess/onError/onSettled)
 * 을 덮어쓰는 함정이 있어(A 삭제 진행 중 B를 누르면 A의 콜백이 유실), 파일별로 컴포넌트를 쪼개
 * 인스턴스를 분리하는 것이 표준 해법이다. 이 컴포넌트 자신의 deleteMutation.isPending이 곧
 * "이 파일 삭제 중" 상태이므로, 상위가 Set으로 수동 추적할 필요가 없다(과잉 상태 관리 제거).
 */
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

  // 이미 서버에 올라간 첨부(fileId 보유)만 다운로드 대상 — 편집 모드 기존 첨부는 전부 해당한다.
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
      {/* 이미지 첨부만 미리보기 모달(비이미지는 다운로드만). 버튼이 여러 개라 아이콘 전용(compact). */}
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

/**
 * 편집모드(T5.4) 첨부 업로드/삭제 섹션 — T5.1의 read-only ExistingAttachmentList를 대체한다.
 * approval AttachmentSection.tsx 패턴 이식(hidden input+ref 트리거, 파일별 삭제는
 * DeletableFileItem에 위임). 미리보기/다운로드(F1522)는 M4 완료정의에 없어 범위 밖이다 —
 * 파일명·확장자·용량 표시+업로드+삭제만 다룬다.
 *
 * 업로드는 messageId 선존이 전제라 로컬 스테이징 없이 선택 즉시 사전검증→업로드한다(§🧩 "편집
 * 모드는 즉시 호출"). 삭제는 완전삭제(AlertDialog 필수)와 성격이 다른 개별 파일 삭제라
 * approval 선례처럼 확인 없이 즉시 실행한다.
 */
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
    // 사전검증(MessageFileValidationError)은 axios 에러가 아니라 normalizeApiError가 "알 수 없는
    // 오류"로 뭉개므로, 그 한국어 메시지를 그대로 노출하도록 instanceof로 먼저 분기한다.
    if (error instanceof MessageFileValidationError) {
      toast.error(error.message)
      return
    }
    toast.error(normalizeApiError(error).message)
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    // 같은 파일을 재선택해도 change가 다시 발화하도록 즉시 비운다(검증 실패 후 재시도 대비).
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
  /** 대상 쪽지 id(임시보관 편집 진입). 존재 여부로만 모드를 파생한다 — 실제 프리필은 T5.1 범위. */
  messageId?: number
  onBack: () => void
  /** 답장 진입 시 발신자·제목·본문 프리필(T4.4). messageId와 동시 전달되지 않는다(호출부 보장). */
  initialValues?: MessageComposeInitialValues
  /** 편집모드(T5.3-b) [발송] — MessageBoxPage가 sendDraft mutate+navigate까지 소유한다. */
  onSend?: () => void
  /** 편집모드(T5.3-b) [삭제] — AlertDialog 확인 후에만 호출된다. */
  onDelete?: () => void
}

/**
 * 쪽지 작성 뷰(ROADMAP(MESSAGE) T4.1·T4.3-b·T4.4·T5.4, F1506·F1507·F1519·F1520·F1521, PRD
 * §페이지별 상세 쪽지 작성 뷰, §🧩 첨부 2단계 흐름, §지원 UI 답장).
 *
 * initialValues(T4.4, 답장 진입)가 있으면 마운트 시 수신자·제목·본문을 프리필한다 — 이후 사용자
 * 입력을 덮어쓰지 않도록 useState 초기값/useZodForm defaultValues로만 시드하고 별도 useEffect
 * 동기화는 두지 않는다(컴포넌트가 매 답장마다 새로 마운트되므로 초기값 시딩으로 충분).
 *
 * MessageBoxPage(T2.2-a)가 activeView==='compose'일 때 카드 내 뷰 전환으로 마운트하는 새 작성/편집
 * 공용 컨테이너다. 수신자는 shared EmployeePicker(다중 selected/onChange)를 로컬 state로 그대로
 * 소비해 receiverIds를 파생하고, 제목/본문은 messageDraftSchema(zod)로 RHF 검증한다(useZodForm +
 * submitWithErrorMapping, approval 표준 폼 패턴 재사용). 첨부는 로컬 File[] 스테이징 UI(approval
 * DraftAttachmentsCard 이식)로, 추가 시점에 messageFileValidation으로 사전검증해 위반 시
 * toast.error로 알린다.
 *
 * [전송]/[임시저장]은 첨부 유무로 분기하는 draft-first 오케스트레이션을 직접 소비한다(T4.3-b):
 * 첨부 없는 발송=sendMessage 단건, 첨부 있는 발송=createDraft→uploadMessageFiles→sendDraft(첨부
 * 전 전달 방지를 위해 반드시 이 순서), 임시저장=createDraft(+첨부 시 uploadMessageFiles만). 화면
 * 카피는 "전송"/"임시저장" 단일 유지(draft-first 여부는 PRD Open Q#6 확정대로 비노출).
 *
 * 편집모드(T5.1, messageId!=null — 임시보관 행 클릭 진입)에서는 useMessageDetailQuery·
 * useMessageFilesQuery(T3.1·T3.2)로 원본 title/content/receivers·첨부 목록을 조회해, 데이터
 * 도착 시 1회성 useRef 가드(MessageDetailView 자동읽음 패턴 동형)로 form.reset+selectedEmployees
 * 를 프리필한다. 첨부는 업로드/삭제 인터랙션 섹션(EditableAttachmentSection, T5.4 — uploadMessageFiles
 * 는 T4.3-a 재사용, 삭제는 신규 deleteMessageFile)을 보여주고, 신규작성 전용 로컬 File[] 스테이징
 * UI는 편집모드에서 렌더하지 않는다. initialValues(T4.4, 답장)와는 shape·출처가 달라 재사용하지
 * 않는다 — messageId·initialValues 동시 전달은 호출부(MessageBoxPage)가 상호 배타로 보장하므로
 * 여기서 별도 방어 로직을 두지 않는다.
 *
 * 편집모드의 [저장](T5.2)은 updateDraft(제목/본문, dirtyFields일 때만)·updateDraftReceivers
 * (수신자, 항상)를 Promise.allSettled로 병렬 호출한다 — [전송]/[임시저장](신규작성 전용)과
 * 달리 페이지 이동 없이 편집을 계속할 수 있어야 한다. [발송](T5.3-b)은 onSend를 즉시 호출하고
 * (sendDraft mutate+navigate는 MessageBoxPage 소유), [삭제](T5.3-b)는 AlertDialog 확인 후에만
 * onDelete를 호출한다(완전삭제와 달리 하드삭제·휴지통 미경유임을 다이얼로그 문구에 명시).
 */
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
  // 수신자 선택 모달 열림 상태: 부서/검색 브라우징(EmployeePicker)은 모달 안에 두고, 폼에는
  // 선택된 수신자 칩만 표기한다. 모달 안 EmployeePicker는 selectedEmployees에 직접 바인딩해
  // 선택이 즉시 폼 칩에 반영된다(별도 staging 없음 — 답장/편집 프리필 초기값도 그대로 노출).
  const [receiverDialogOpen, setReceiverDialogOpen] = useState(false)
  // draft-first 오케스트레이션 중 createDraft가 발급한 messageId. 중간 단계(업로드/발송) 실패 후
  // 재시도 시 이 값이 남아 있으면 createDraft를 재호출하지 않고 실패 지점부터 재개한다.
  const [resumeMessageId, setResumeMessageId] = useState<number | undefined>(undefined)

  const sendMessageMutation = useSendMessageMutation()
  const createDraftMutation = useCreateDraftMutation()
  const uploadFilesMutation = useUploadMessageFilesMutation()
  const sendDraftMutation = useSendDraftMutation()
  const updateDraftMutation = useMessageDraftUpdateMutation()
  const updateReceiversMutation = useMessageDraftReceiversUpdateMutation()

  // 편집모드(T5.1) 원본 프리필 데이터. 신규작성/답장(messageId==null)에서는 둘 다 enabled:false로
  // 대기해 추가 요청이 나가지 않는다.
  const detailQuery = useMessageDetailQuery(isEditMode ? messageId : undefined)
  const filesQuery = useMessageFilesQuery(isEditMode ? messageId : undefined)
  // 데이터가 도착한 시점에 딱 1회만 form.reset+selectedEmployees를 채운다(MessageDetailView
  // 자동읽음 1회 가드와 동형) — 이후 사용자가 입력 중인 값을 재조회·리렌더로 덮어쓰지 않는다.
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

  /**
   * 임시 쪽지(draft) messageId 확보. 이전 시도에서 이미 createDraft가 성공했다면(resumeMessageId
   * 보존) 재호출하지 않고 그 값을 그대로 재사용한다 — 실패 지점부터 재개(중복 draft 생성 방지).
   */
  async function ensureDraftMessageId(payload: MessageCreateRequest): Promise<number> {
    if (resumeMessageId != null) {
      // 재개 경로는 createDraft를 건너뛰고 이미 발급된 id를 그대로 재사용한다 — 재시도 사이에
      // title/content/receiverIds를 고쳐도 서버 draft는 최초 제출값 그대로다(구 값으로 전송/
      // 저장됨). 재개 시점에 서버 draft를 최신 폼값으로 동기화하려면 updateDraft가 필요한데
      // 이는 T5.2 산출물이라 아직 없다 — 지금 임시방편을 만들면 T5.2와 중복/충돌할 위험이 커
      // T5.2 완료 전까지는 이 제약을 그대로 둔다(team-lead 확인, 2026-07-10).
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
      // 첨부 없는 발송: MESSAGE_SEND 단건. createDraft를 거치지 않아 실패해도 아무것도 남지
      // 않으므로, 이 에러는 그대로 던져 submitWithErrorMapping의 기본 서버 에러 매핑에 맡긴다.
      await sendMessageMutation.mutateAsync({ ...values, receiverIds })
      toast.success('쪽지를 전송했습니다')
      onBack()
      navigate('/messages/sent')
      return
    }

    // 첨부 있는 발송: createDraft(messageId 확보)→uploadMessageFiles→sendDraft 순서를 반드시
    // 지킨다(첨부 전 발송 방지). createDraft 자체가 실패하면(아직 아무것도 저장 안 됨) 그대로
    // 전파하고, createDraft 이후(id 확보 후) 단계가 실패하면 이미 임시보관함에 저장돼 있다는
    // 사실을 알리는 전용 토스트를 띄운 뒤 재던져 폼 에러도 함께 노출한다.
    const id = await ensureDraftMessageId({ ...values, receiverIds })
    try {
      // 재개 단위가 draft(messageId) 뿐이라, upload 성공 후 sendDraft만 실패해 재시도하면 이미
      // 성공한 파일도 다시 전송될 수 있다(서버에 dedup·idempotency 키 없음, 순차 append). 이는
      // T4.3-b가 새로 만든 문제가 아니라 board→approval→message가 공유하는 기존 순차-업로드
      // -부분실패-비복구 설계의 연장(approval useDraftFileUploadMutation.ts 동일 한계 문서화
      // 선례)이라 이 태스크에서 별도로 막지 않는다(team-lead 확인, 2026-07-10).
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

  /**
   * 편집모드(T5.2) 저장 — 발송/삭제(T5.3)와 달리 페이지 이동 없이 편집을 계속할 수 있어야 한다.
   * 제목/본문은 dirtyFields일 때만 updateDraft를 호출하고(변경 없으면 불필요한 요청 생략),
   * 수신자는 selectedEmployees 기준 항상 updateDraftReceivers를 호출한다(두 리소스가 서로
   * 독립적이라 값 비교로 스킵하지 않음 — team-lead 확정 설계). 두 mutation은 상호 의존이 없어
   * Promise.allSettled로 병렬 실행하고, 실패는 그대로 던져 submitWithErrorMapping의 표준
   * handleApiError 위임에 맡긴다(신규 에러분기 없음).
   */
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
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft />
          목록으로
        </Button>
      </div>

      {/* 작성 헤더(쪽지함 메인 헤더 3요소와 톤 통일): 제목 + 부제(레퍼런스 메일함 작성 화면 참고). */}
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {isEditMode ? '쪽지 수정' : '새 쪽지 작성'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isEditMode
            ? '임시 저장한 쪽지를 이어서 수정합니다.'
            : '여러 사원에게 동시에 쪽지를 보낼 수 있습니다.'}
        </p>
      </div>

      <Card className="flex min-h-0 min-w-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <form
            noValidate
            // 편집모드는 [저장] 버튼이 type=button으로 handleSave를 직접 트리거한다(발송 전용
            // handleSend가 Enter 키 등으로 실수 제출되지 않도록 폼 자체 submit은 no-op으로 둔다
            // — approval GeneralDraftEditForm과 동일 패턴).
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

              {/* 선택된 수신자 칩(EmployeePicker 내부 칩과 동일 톤). 개별 X로 제거한다 —
                  모달이 닫혀 EmployeePicker가 언마운트돼도 폼에서 선택을 확인/해제할 수 있다. */}
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

              {/* 수신자 브라우징 모달: 부서/검색 UI(EmployeePicker)를 모달 안으로 옮겨 폼 세로 공간을
                  절약한다(CirculationAddDialog 패턴). 선택은 selectedEmployees에 즉시 반영된다. */}
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
              {/* 받는 사람 필드가 모달로 빠져 절약된 세로 공간을 내용 입력이 flex-1로 흡수한다. */}
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
                // 편집모드(T5.4): 업로드/삭제 인터랙션 섹션. 신규작성 전용 로컬 File[] 스테이징
                // UI는 렌더하지 않는다.
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
                      // 같은 파일을 다시 골라도 change가 발생하도록 입력값을 비운다(approval 동형).
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
                // 편집모드: [삭제](T5.3-b, AlertDialog 확인)·[저장](T5.2)·[발송](T5.3-b, 즉시).
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
