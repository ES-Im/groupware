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
