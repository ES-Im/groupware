import { useEffect, useRef, useState } from 'react'
import { Loader2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useBoardFileDeleteMutation } from '../api/useBoardFileDeleteMutation'
import { useBoardFilesQuery } from '../api/useBoardFilesQuery'
import { useBoardFileUploadMutation } from '../api/useBoardFileUploadMutation'
import { BoardFileValidationError } from '../lib/fileValidation'

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). EmployeeInfoView.tsx의 동일 이름 헬퍼와 표기
 * 방식을 그대로 복제한다(공유 유틸 승격은 이번 태스크 범위 밖). */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 첨부파일 목록·추가 업로드·개별 삭제 섹션(F304/F309/F312, ROADMAP T13.3-b).
 *
 * useBoardFilesQuery(T11.1)·useBoardFileUploadMutation/useBoardFileDeleteMutation(T13.2)를
 * 그대로 소비한다(재구현 금지). 다중 파일 선택 시 useBoardFileUploadMutation의 mutationFn이
 * 파일별 순차 PATCH를 이미 내부 처리하므로(§열린항목3), 여기서는 선택된 파일 배열 전체를 한 번의
 * mutate 호출로 넘기기만 한다 — mutate를 파일별로 여러 번 호출하는 새 업로드 전략은 만들지 않는다.
 * 업로드 진행 중에는 파일 추가 버튼/입력을 비활성화하고 라벨을 "업로드 중..."으로 바꿔 전체
 * 진행상황만 표시한다(개별 파일 단위 진행률은 mutation이 노출하지 않아 발명하지 않는다).
 *
 * 사전검증(`BoardFileValidationError`, T13.2 `validateBoardFileUpload`) 위반은 mutationFn이
 * 네트워크 호출 전에 동기적으로 던지므로 실제 업로드 요청은 발생하지 않는다(boardFileMutations.
 * invalidate.test.tsx가 이미 검증). 이 컴포넌트는 그 메시지를 그대로 토스트에 노출한다 —
 * `normalizeApiError`는 axios 에러 전용 분기만 인식해 이 도메인 에러를 "알 수 없는 오류"로 뭉개
 * 버리므로 별도로 `instanceof` 분기한다.
 */
export function BoardEditAttachments({ boardId }: { boardId: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filesQuery = useBoardFilesQuery(boardId)
  const uploadMutation = useBoardFileUploadMutation()
  const deleteMutation = useBoardFileDeleteMutation()
  const files = filesQuery.data ?? []

  // 삭제 진행 중인 fileId 집합(code-reviewer 지적 반영, non-minor). 단일 deleteMutation 인스턴스의
  // variables/isPending은 "마지막 mutate 호출" 값만 반영해, A 삭제 중 B를 누르면 A행의 disabled가
  // 풀려 중복 DELETE(→404 토스트)가 나갈 수 있었다 — fileId별로 로컬 state에서 개별 추적한다.
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!filesQuery.error) {
      return
    }
    toast.error(normalizeApiError(filesQuery.error).message)
  }, [filesQuery.error])

  function reportUploadError(error: unknown) {
    if (error instanceof BoardFileValidationError) {
      toast.error(error.message)
      return
    }
    toast.error(normalizeApiError(error).message)
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    // 같은 파일을 재선택해도 change 이벤트가 다시 발화하도록 즉시 비운다(검증 실패 후 재시도 대비).
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    uploadMutation.mutate(
      { boardId, files: selected, existingFiles: files },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { boardId, fileId },
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

  return (
    <Card className="mt-4">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-1.5">
            <Paperclip className="size-4" />
            첨부파일{files.length > 0 && ` ${files.length}개`}
          </CardTitle>
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
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {files.map((file) => {
              const isDeleting = deletingFileIds.has(file.fileId)
              return (
                <li
                  key={file.fileId}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-foreground">
                    {file.originalName}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSizeMb(file.fileSize)}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      disabled={isDeleting}
                      onClick={() => handleDelete(file.fileId)}
                      aria-label={`${file.originalName} 삭제`}
                    >
                      {/* 파일별 삭제 진행 상태(deletingFileIds)를 개별 스피너로 표시한다 —
                          동시 삭제 시 각 행이 독립적으로 진행 표시되도록 로컬 상태를 그대로 소비한다. */}
                      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
