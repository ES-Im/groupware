import { useRef } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useMeetingRoomFileUploadMutation } from '../api/useMeetingRoomFileUploadMutation'
import { MeetingRoomFileValidationError } from '../lib/meetingRoomFileValidation'

interface MeetingRoomImageUploadButtonProps {
  meetingRoomId: number
}

/**
 * 회의실 관리 상세(P7)의 안내 이미지 업로드 버튼(F815, ROADMAP(MEETING-ROOMS) T7.2-c).
 *
 * useMeetingRoomFileUploadMutation(T7.1)을 그대로 소비한다 — mutationFn 내부에서
 * validateMeetingRoomFileUpload(확장자·용량)를 먼저 통과해야 실제 PATCH가 나간다. 위반 시
 * MeetingRoomFileValidationError가 그대로 던져지므로 board reportUploadError와 동일하게 별도
 * instanceof 분기로 메시지를 그대로 토스트에 노출하고, 그 외(서버) 에러는 handleApiError로 위임한다.
 * 훅 시그니처가 파일 1개(`file: File`)만 받으므로(board와 달리 다중 업로드 미지원, T7.1 확정)
 * input에도 `multiple`을 두지 않는다.
 */
export function MeetingRoomImageUploadButton({ meetingRoomId }: MeetingRoomImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useMeetingRoomFileUploadMutation()

  function reportUploadError(error: unknown) {
    if (error instanceof MeetingRoomFileValidationError) {
      toast.error(error.message)
      return
    }
    handleApiError(error, { toast })
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // 같은 파일을 재선택해도 change 이벤트가 다시 발화하도록 즉시 비운다(검증 실패 후 재시도 대비).
    event.target.value = ''
    if (!file) {
      return
    }
    uploadMutation.mutate(
      { meetingRoomId, file },
      {
        onSuccess: () => toast.success('안내 이미지를 업로드했습니다'),
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
        {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
        {uploadMutation.isPending ? '업로드 중...' : '이미지 업로드'}
      </Button>
    </>
  )
}
