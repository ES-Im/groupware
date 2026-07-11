import { useRef } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useEmpFileUploadMutation } from '../api/useEmpFileUploadMutation'
import { EmpFileValidationError } from '../lib/empFileValidation'
import type { FileType } from '../model/me'

interface EmpFileUploadButtonProps {
  /** 사원 식별 번호. 미확정이면 업로드 경로를 만들 수 없어 버튼을 비활성화한다. */
  empId: number | undefined
  fileType: FileType
  label: string
}

/**
 * 사원 파일(프로필사진/전자서명) 업로드 버튼(`MeetingRoomImageUploadButton` 패턴 복제,
 * fileType 쿼리만 추가된 형태). `SignatureCard`/`EmpFileManagementPanel`이 공유한다.
 *
 * useEmpFileUploadMutation의 mutationFn 내부에서 validateEmpFileUpload(확장자·용량)를 먼저
 * 통과해야 실제 PATCH가 나간다. 위반 시 EmpFileValidationError가 그대로 던져지므로 board/meeting과
 * 동일하게 별도 instanceof 분기로 메시지를 그대로 토스트에 노출하고, 그 외(서버) 에러는
 * handleApiError로 위임한다. 도메인 규칙(같은 타입은 하나만 활성화 가능, 새 파일 등록 시 기존
 * 파일 자동 비활성화)은 서버가 처리하므로 여기서는 파일 선택 → 업로드만 담당한다.
 */
export function EmpFileUploadButton({ empId, fileType, label }: EmpFileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useEmpFileUploadMutation()

  function reportUploadError(error: unknown) {
    if (error instanceof EmpFileValidationError) {
      toast.error(error.message)
      return
    }
    handleApiError(error, { toast })
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // 같은 파일을 재선택해도 change 이벤트가 다시 발화하도록 즉시 비운다(검증 실패 후 재시도 대비).
    event.target.value = ''
    if (!file || empId === undefined) {
      return
    }
    uploadMutation.mutate(
      { empId, fileType, file },
      {
        onSuccess: () => toast.success('파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        disabled={empId === undefined || uploadMutation.isPending}
        onChange={handleFileInputChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={empId === undefined || uploadMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
        {uploadMutation.isPending ? '업로드 중...' : label}
      </Button>
    </>
  )
}
