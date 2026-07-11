import { useEffect, useState } from 'react'
import { FileText, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getFileTypeLabel } from '@/shared/lib/activeFiles'
import { handleApiError, normalizeApiError } from '@/shared/lib/apiError'
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
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useEmpFileActivateMutation } from '../api/useEmpFileActivateMutation'
import { useEmpFileDeleteMutation } from '../api/useEmpFileDeleteMutation'
import { useFilesInfosQuery } from '../api/useFilesInfosQuery'
import { EmpFileUploadButton } from './EmpFileUploadButton'

function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface EmpFileManagementPanelProps {
  /** 사원 식별 번호. 활성화/삭제 경로에 필요 — 미확정이면 해당 액션 버튼을 비활성화한다. */
  empId: number | undefined
}

/**
 * "파일관리" 탭 패널(EmployeeProfileTabs의 viewerIsSelf 전용 탭, adapt-ui 리디자인 신규).
 *
 * `RETRIEVE_ME_INFO.activeFiles`(활성만)가 아니라 `RETRIEVE_FILES_INFOS`(활성+비활성 전체,
 * useFilesInfosQuery)를 데이터 소스로 쓴다 — 비활성 파일을 다시 활성화(ACTIVATE_ME_FILE)하려면
 * 목록에 애초에 보여야 하기 때문이다. 각 행에 활성화(비활성 파일만)/삭제 액션을 제공한다.
 *
 * 레퍼런스의 "보관 파일"(일반 첨부) 섹션은 렌더하지 않는다 — 사원 FileType은 PROFILE_PICTURE/
 * SIGNATURE 2종뿐이라(도메인모델.md 실측) 근거 없는 목업 요소이기 때문이다(사용자 확인 완료).
 */
export function EmpFileManagementPanel({ empId }: EmpFileManagementPanelProps) {
  const filesQuery = useFilesInfosQuery(true)
  const activateMutation = useEmpFileActivateMutation()
  const deleteMutation = useEmpFileDeleteMutation()
  // 처리 중인 fileId 집합(MeetingRoomImageGallery.deletingFileIds와 동일 이유) — 공유 mutation
  // 인스턴스의 isPending만으로는 어느 행이 처리 중인지 구분할 수 없어 행별로 별도 추적한다.
  const [processingFileIds, setProcessingFileIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!filesQuery.error) {
      return
    }
    toast.error(normalizeApiError(filesQuery.error).message)
  }, [filesQuery.error])

  function withProcessing(fileId: number, run: () => void) {
    setProcessingFileIds((prev) => new Set(prev).add(fileId))
    run()
  }

  function clearProcessing(fileId: number) {
    setProcessingFileIds((prev) => {
      const next = new Set(prev)
      next.delete(fileId)
      return next
    })
  }

  function handleActivate(fileId: number) {
    withProcessing(fileId, () => {
      activateMutation.mutate(
        { fileId, isForActivate: true },
        {
          onSuccess: () => toast.success('파일을 활성화했습니다'),
          onError: (error) => handleApiError(error, { toast }),
          onSettled: () => clearProcessing(fileId),
        },
      )
    })
  }

  function handleDelete(fileId: number) {
    if (empId === undefined) {
      return
    }
    withProcessing(fileId, () => {
      deleteMutation.mutate(
        { empId, fileId },
        {
          onSuccess: () => toast.success('파일을 삭제했습니다'),
          onError: (error) => handleApiError(error, { toast }),
          onSettled: () => clearProcessing(fileId),
        },
      )
    })
  }

  const files = filesQuery.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <EmpFileUploadButton empId={empId} fileType="SIGNATURE" label="전자서명 첨부" />
        <EmpFileUploadButton empId={empId} fileType="PROFILE_PICTURE" label="프로필 사진 첨부" />
      </div>

      {filesQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : files.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">등록된 파일이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {files.map((item) => {
            const isProcessing = processingFileIds.has(item.file.fileId)
            return (
              <li
                key={item.file.fileId}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="truncate text-sm font-semibold text-foreground">
                        {getFileTypeLabel(item.type)}
                      </h5>
                      <Badge variant={item.isActive ? 'default' : 'outline'}>
                        {item.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.file.originalName} · {formatFileSizeMb(item.file.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {!item.isActive && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleActivate(item.file.fileId)}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : null}
                      활성화
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        disabled={isProcessing || empId === undefined}
                        aria-label={`${item.file.originalName} 삭제`}
                      >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <Trash2 />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>파일을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>삭제한 파일은 되돌릴 수 없습니다.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.file.fileId)}
                          disabled={isProcessing}
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
