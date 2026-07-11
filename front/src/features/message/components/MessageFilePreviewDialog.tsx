import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { useMessageFilePreviewUrl } from '../api/useMessageFilePreviewUrl'
import type { FileListInfo } from '../model/messageTypes'

/**
 * 미리보기 본문 — Dialog가 열렸을 때만 마운트된다(아래 조건부 렌더). 그 덕에
 * useMessageFilePreviewUrl이 모달 열림 동안에만 objectURL을 물고, 닫히면 언마운트되어
 * 훅 클린업이 revokeObjectURL을 수행한다(별도 정리 로직 불필요).
 */
function PreviewBody({ messageId, file }: { messageId: number; file: FileListInfo }) {
  const { objectUrl, isLoading, isError } = useMessageFilePreviewUrl(messageId, file.fileId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        미리보기를 불러오는 중...
      </div>
    )
  }

  if (isError || !objectUrl) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        이미지를 불러오지 못했습니다.
      </div>
    )
  }

  return (
    <img
      src={objectUrl}
      alt={file.originalName}
      className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
    />
  )
}

interface MessageFilePreviewDialogProps {
  messageId: number
  file: FileListInfo
  /** true면 아이콘 전용 트리거(버튼이 여러 개 붙는 좁은 편집 첨부 목록용). 기본 텍스트 버튼. */
  compact?: boolean
}

/**
 * 쪽지 첨부 이미지 미리보기 모달(F1522). [미리보기] 트리거 + Dialog 안 이미지로 구성한다.
 * 상세 뷰(MessageAttachmentSection)와 편집 모드 첨부(MessageComposeView)가 공유하며,
 * 이미지 확장자 첨부에만 렌더한다(비이미지는 다운로드만). open 상태는 각 인스턴스 로컬 소유라
 * 여러 첨부의 미리보기가 서로 간섭하지 않는다.
 */
export function MessageFilePreviewDialog({
  messageId,
  file,
  compact = false,
}: MessageFilePreviewDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            aria-label={`${file.originalName} 미리보기`}
          >
            <Eye />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="shrink-0">
            <Eye />
            미리보기
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{file.originalName}</DialogTitle>
        </DialogHeader>
        <PreviewBody messageId={messageId} file={file} />
      </DialogContent>
    </Dialog>
  )
}
