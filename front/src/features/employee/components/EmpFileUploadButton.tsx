import { useRef } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { useEmpFileUploadMutation } from '../api/useEmpFileUploadMutation'
import { EmpFileValidationError } from '../lib/empFileValidation'
import type { FileType } from '../model/me'

interface EmpFileUploadButtonProps {
  empId: number | undefined
  fileType: FileType
  label: string
}

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
