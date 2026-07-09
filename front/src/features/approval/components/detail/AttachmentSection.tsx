import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { downloadDraftFile } from '../../api/downloadDraftFile'
import { useDraftFileDeleteMutation } from '../../api/useDraftFileDeleteMutation'
import { useDraftFilePreviewUrl } from '../../api/useDraftFilePreviewUrl'
import { useDraftFileUploadMutation } from '../../api/useDraftFileUploadMutation'
import { DraftFileValidationError } from '../../lib/draftFileValidation'
import { isDraftImageExtension } from '../../lib/isDraftImageExtension'
import type { DraftFile } from '../../model/draftDetail'
import type { DraftDetailSectionProps } from './types'

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). BoardEditPage·EmployeeInfoView의 동일 이름
 * 헬퍼와 표기 방식을 통일한다(M2 code-reviewer minor 지적 반영 — 공유 유틸 승격은 이번 태스크 범위 밖). */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 이미지 첨부 인라인 미리보기(F718 DRAFT_FILE_PREVIEW). objectURL 생명주기는 useDraftFilePreviewUrl
 * (T6.2)에 전부 위임하고, 이 컴포넌트는 로딩/실패/성공 3분기 렌더만 담당한다(board BoardImagePreview
 * 복제). 훅은 조건부 호출이 불가하므로 이미지 첨부마다 이 서브컴포넌트로 분리해 호출한다.
 */
function DraftImagePreview({ draftId, file }: { draftId: number; file: DraftFile }) {
  const { objectUrl, isLoading, isError } = useDraftFilePreviewUrl(draftId, file.fileId)

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
 * 첨부 영역(ROADMAP(DRAFT) T2.3 read-only 목록 → M6 T6.1~T6.3 확장).
 *
 * 노출 판정(PRD §접근 권한 — 프론트는 노출만, 최종은 서버):
 * - **조회 가능자 전원**: 미리보기(F718, 이미지=인라인)/다운로드(F719, 비이미지=버튼). 상세
 *   (DRAFT_DETAIL)를 열람하고 있다는 것 자체가 서버가 조회 가능자(기안자·결재자·공람 대상자)로
 *   판정했음을 의미하므로 별도 클라이언트 게이팅을 두지 않는다(board 첨부 UX 복제).
 * - **기안자 본인**: 업로드(F716)/삭제(F717). `me.empBasicInfo.empId === draft.drafter.empId`로
 *   판정한다(numeric empId는 me 응답 empBasicInfo에 보강된 사원 PK — model/me.ts). me 미로딩 등으로
 *   empId가 미확정(undefined)이면 업로드/삭제를 노출하지 않는다(방어적 미노출). 최종 권한은 서버가
 *   판정하므로 이 게이팅은 UX 힌트이며, 서버 위반은 apiError 토스트로 처리한다.
 *
 * props는 `{ draft }` 고정 계약을 유지한다(types.ts DraftDetailSectionProps).
 */
export function AttachmentSection({ draft }: DraftDetailSectionProps) {
  const { draftId, files } = draft

  const meQuery = useMeQuery()
  const myEmpId = meQuery.data?.empBasicInfo.empId
  // 기안자 본인 판정: numeric empId 매칭. empId 미확정 시 업로드/삭제 미노출(undefined 방어).
  const isDrafter = myEmpId != null && myEmpId === draft.drafter.empId

  const uploadMutation = useDraftFileUploadMutation()
  const deleteMutation = useDraftFileDeleteMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 삭제 진행 중인 fileId 집합(board 첨부 섹션 복제). 단일 deleteMutation 인스턴스의 variables/isPending은
  // "마지막 mutate 호출" 값만 반영해, A 삭제 중 B를 누르면 A행 disabled가 풀려 중복 DELETE가 나갈 수
  // 있으므로 fileId별로 로컬 state에서 개별 추적한다.
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

  function reportUploadError(error: unknown) {
    // 사전검증(DraftFileValidationError)은 axios 에러가 아니라 normalizeApiError가 "알 수 없는 오류"로
    // 뭉개므로, 그 한국어 메시지를 그대로 노출하도록 instanceof로 먼저 분기한다.
    if (error instanceof DraftFileValidationError) {
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
      { draftId, files: selected, existingFiles: files },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { draftId, fileId },
      {
        onSuccess: () => toast.success('첨부파일을 삭제했습니다'),
        onError: (error) => toast.error(normalizeApiError(error).message),
        onSettled: () => {
          // 성공/실패 어느 쪽이든 해당 fileId의 진행 상태를 해제한다.
          setDeletingFileIds((prev) => {
            const next = new Set(prev)
            next.delete(fileId)
            return next
          })
        },
      },
    )
  }

  function handleDownload(file: DraftFile) {
    downloadDraftFile(draftId, file.fileId, file.originalName).catch((error: unknown) => {
      toast.error(normalizeApiError(error).message)
    })
  }

  return (
    <section className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Paperclip className="size-4" />
          첨부파일{files.length > 0 ? ` ${files.length}개` : ''}
        </h3>
        {/* (기안자 본인) 첨부 업로드(F716). 다중 선택은 mutation이 파일별 순차 PATCH로 처리한다. */}
        {isDrafter && (
          <>
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
          </>
        )}
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => {
            const isImage = isDraftImageExtension(file.extension)
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
                  {/* 비이미지 첨부는 다운로드 버튼(F719). 이미지 첨부는 아래 인라인 미리보기(F718). */}
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
                  {/* (기안자 본인) 첨부 삭제(F717). 파일별 삭제 진행 상태를 개별 스피너로 표시한다. */}
                  {isDrafter && (
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
                  )}
                </div>
                {isImage && <DraftImagePreview draftId={draftId} file={file} />}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
