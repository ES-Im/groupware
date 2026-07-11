import { Download, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadMessageFile } from '../api/downloadMessageFile'
import { useMessageFilesQuery } from '../api/useMessageFilesQuery'
import { isMessageImageExtension } from '../lib/messageImageExtension'
import type { FileListInfo } from '../model/messageTypes'
import { MessageFilePreviewDialog } from './MessageFilePreviewDialog'

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). approval AttachmentSection의 동일 이름
 * 헬퍼와 표기 방식을 통일한다(공유 유틸 승격은 이번 태스크 범위 밖 — approval 선례와 동일 판단). */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface MessageAttachmentSectionProps {
  /** 첨부 목록·미리보기·다운로드의 조회 대상 쪽지 id — T3.3-a가 확정한 단일 prop 계약. */
  messageId: number
}

/**
 * 쪽지 첨부 섹션(ROADMAP(MESSAGE) T3.3-b, F1519·F1522).
 *
 * approval AttachmentSection의 read-only 축소 이식: useMessageFilesQuery(T3.2)로 첨부 목록을
 * 조회해 파일명+용량을 렌더하고, 이미지 확장자는 모달 미리보기(MessageFilePreviewDialog), 전체
 * 파일은 다운로드 버튼(downloadMessageFile)을 노출한다. 상세(MESSAGE_DETAIL)를 열람하고 있다는
 * 것 자체가 서버가 조회 가능자로 판정했음을 의미하므로 별도 클라이언트 게이팅을 두지 않는다
 * (approval 동일).
 *
 * 업로드(F1520)·삭제(F1521) UI는 편집 모드 전용(T5.4 몫)이라 완전히 read-only로 유지한다.
 * 첨부 목록 조회 실패는 상세 본문과 독립된 부가 정보 실패라 목록 복귀 UX 없이 섹션 내 인라인
 * 폴백으로만 알린다(apiError 매핑 소비).
 */
export function MessageAttachmentSection({ messageId }: MessageAttachmentSectionProps) {
  const filesQuery = useMessageFilesQuery(messageId)
  const files = filesQuery.data ?? []

  function handleDownload(file: FileListInfo) {
    downloadMessageFile(messageId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Paperclip className="size-4" />
        첨부파일{files.length > 0 ? ` ${files.length}개` : ''}
      </h3>

      {filesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
      ) : filesQuery.isError ? (
        <p className="text-sm text-muted-foreground">
          {normalizeApiError(filesQuery.error).message}
        </p>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => {
            const isImage = isMessageImageExtension(file.extension)
            return (
              <li
                key={file.fileId}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-foreground">{file.originalName}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatFileSizeMb(file.fileSize)}
                </span>
                {/* 이미지 첨부만 미리보기 모달을 연다(비이미지는 다운로드만). */}
                {isImage && <MessageFilePreviewDialog messageId={messageId} file={file} />}
                {/* 다운로드는 이미지/비이미지 모두 노출한다(F1522). */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleDownload(file)}
                  aria-label={`${file.originalName} 다운로드`}
                >
                  <Download />
                  다운로드
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
