import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadEducationFile } from '../api/downloadEducationFile'
import { useEducationFileDeleteMutation } from '../api/useEducationFileDeleteMutation'
import { useEducationFilePreviewUrl } from '../api/useEducationFilePreviewUrl'
import { useEducationFileUploadMutation } from '../api/useEducationFileUploadMutation'
import { EducationFileValidationError } from '../lib/educationFileValidation'
import { isEducationImageExtension } from '../lib/isEducationImageExtension'
import type { FranchiseEducationFileInfo } from '../model/franchise'

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). approval AttachmentSection과 표기 방식 통일. */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 이미지 첨부 인라인 미리보기(EDUCATION_FILE_PREVIEW). objectURL 생명주기는
 * useEducationFilePreviewUrl에 전부 위임하고, 이 컴포넌트는 로딩/실패/성공 3분기 렌더만
 * 담당한다(approval DraftImagePreview 복제). 훅은 조건부 호출이 불가하므로 이미지 첨부마다
 * 이 서브컴포넌트로 분리해 호출한다.
 */
function EducationImagePreview({
  educationId,
  file,
}: {
  educationId: number
  file: FranchiseEducationFileInfo
}) {
  const { objectUrl, isLoading, isError } = useEducationFilePreviewUrl(educationId, file.fileId)

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

/**
 * 교육 첨부 영역(ROADMAP(FRANCHISE) T4.5, approval AttachmentSection.tsx 단일 컴포넌트 패턴
 * 복제). `FranchiseEducationDetailPage`에서 사용한다.
 *
 * 노출 판정(PRD §계약 실측 메모): 상세 응답에 교육 등록자 식별자가 없어(Open Q#6) 프론트에서
 * "등록자 본인" 여부를 판정할 수 없다 — 업로드/삭제 버튼도 조회 가능자 전원(이 페이지에 도달한
 * 인증 사용자)에게 노출하고, 실제 등록자·FRANCHISE/ADMIN 권한 판정은 서버 403이 전담한다
 * (approval처럼 클라이언트 게이팅을 두지 않는다 — 서버 위반은 일반 에러 토스트로 처리).
 */
export function FranchiseEducationAttachmentSection({
  educationId,
  files,
}: {
  educationId: number
  files: FranchiseEducationFileInfo[] | null
}) {
  const fileList = files ?? []

  const uploadMutation = useEducationFileUploadMutation()
  const deleteMutation = useEducationFileDeleteMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 삭제 진행 중인 fileId 집합(approval AttachmentSection 복제). 단일 deleteMutation 인스턴스의
  // variables/isPending은 "마지막 mutate 호출" 값만 반영해, A 삭제 중 B를 누르면 A행 disabled가
  // 풀려 중복 DELETE가 나갈 수 있으므로 fileId별로 로컬 state에서 개별 추적한다.
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

  function reportUploadError(error: unknown) {
    // 사전검증(EducationFileValidationError)은 axios 에러가 아니라 normalizeApiError가 "알 수 없는
    // 오류"로 뭉개므로, 그 한국어 메시지를 그대로 노출하도록 instanceof로 먼저 분기한다.
    if (error instanceof EducationFileValidationError) {
      toast.error(error.message)
      return
    }
    toast.error(normalizeApiError(error).message)
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    // 같은 파일을 재선택해도 change 이벤트가 다시 발화하도록 즉시 비운다(검증 실패 후 재시도 대비).
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    uploadMutation.mutate(
      { educationId, files: selected, existingFiles: fileList },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { educationId, fileId },
      {
        onSuccess: () => toast.success('첨부파일을 삭제했습니다'),
        onError: (error) => toast.error(normalizeApiError(error).message),
        onSettled: () => {
          setDeletingFileIds((prev) => {
            const next = new Set(prev)
            next.delete(fileId)
            return next
          })
        },
      },
    )
  }

  function handleDownload(file: FranchiseEducationFileInfo) {
    downloadEducationFile(educationId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Paperclip className="size-4" />
          첨부파일{fileList.length > 0 ? ` ${fileList.length}개` : ''}
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          disabled={uploadMutation.isPending}
          onChange={handleFileInputChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
        </Button>
      </div>

      {fileList.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {fileList.map((file) => {
            const isImage = isEducationImageExtension(file.extension)
            const isDeleting = deletingFileIds.has(file.fileId)
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="shrink-0"
                    disabled={isDeleting}
                    onClick={() => handleDelete(file.fileId)}
                    aria-label={`${file.originalName} 삭제`}
                  >
                    {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                </div>
                {isImage && <EducationImagePreview educationId={educationId} file={file} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
