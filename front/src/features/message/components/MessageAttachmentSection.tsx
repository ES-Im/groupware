import { Download, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadMessageFile } from '../api/downloadMessageFile'
import { useMessageFilePreviewUrl } from '../api/useMessageFilePreviewUrl'
import { useMessageFilesQuery } from '../api/useMessageFilesQuery'
import type { FileListInfo } from '../model/messageTypes'

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). approval AttachmentSection의 동일 이름
 * 헬퍼와 표기 방식을 통일한다(공유 유틸 승격은 이번 태스크 범위 밖 — approval 선례와 동일 판단). */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 이미지로 인라인 렌더 가능한 첨부 확장자 판별. approval isDraftImageExtension의 message 도메인
 * 로컬 복제다(도메인마다 독립 정의하는 컨벤션 연장 — 공용화는 이 태스크 범위 밖).
 */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif'])

function isMessageImageExtension(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase())
}

/**
 * 이미지 첨부 인라인 미리보기(F1522 MESSAGE_FILE_PREVIEW). objectURL 생명주기는
 * useMessageFilePreviewUrl(T3.2)에 전부 위임하고, 이 컴포넌트는 로딩/실패/성공 3분기 렌더만
 * 담당한다(approval DraftImagePreview 복제). 훅은 조건부 호출이 불가하므로 이미지 첨부마다
 * 이 서브컴포넌트로 분리해 호출한다.
 */
function MessageImagePreview({ messageId, file }: { messageId: number; file: FileListInfo }) {
  const { objectUrl, isLoading, isError } = useMessageFilePreviewUrl(messageId, file.fileId)

  if (isLoading) {
    return (
      <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        미리보기를 불러오는 중...
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

interface MessageAttachmentSectionProps {
  /** 첨부 목록·미리보기·다운로드의 조회 대상 쪽지 id — T3.3-a가 확정한 단일 prop 계약. */
  messageId: number
}

/**
 * 쪽지 첨부 섹션(ROADMAP(MESSAGE) T3.3-b, F1519·F1522).
 *
 * approval AttachmentSection의 read-only 축소 이식: useMessageFilesQuery(T3.2)로 첨부 목록을
 * 조회해 파일명+용량을 렌더하고, 이미지 확장자는 인라인 미리보기(MessageImagePreview), 비이미지는
 * 다운로드 버튼(downloadMessageFile)을 노출한다. 상세(MESSAGE_DETAIL)를 열람하고 있다는 것 자체가
 * 서버가 조회 가능자로 판정했음을 의미하므로 별도 클라이언트 게이팅을 두지 않는다(approval 동일).
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
                className="space-y-2 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Paperclip
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 truncate text-foreground">{file.originalName}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatFileSizeMb(file.fileSize)}
                  </span>
                  {/* 비이미지 첨부는 다운로드 버튼(F1522). 이미지 첨부는 아래 인라인 미리보기. */}
                  {!isImage && (
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
                  )}
                </div>
                {isImage && <MessageImagePreview messageId={messageId} file={file} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
