import { FileX2 } from 'lucide-react'
import { getActiveSignature } from '@/shared/lib/activeFiles'
import { useEmpFilePreviewUrl } from '@/shared/lib/useEmpFilePreview'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmpFileUploadButton } from './EmpFileUploadButton'
import type { ActiveFile } from '../model/me'

interface SignatureCardProps {
  empId: number | undefined
  activeFiles: ActiveFile[]
}

export function SignatureCard({ empId, activeFiles }: SignatureCardProps) {
  const signatureFileId = getActiveSignature(activeFiles)
  const { objectUrl, isError } = useEmpFilePreviewUrl(empId, signatureFileId)
  const hasSignature = Boolean(objectUrl) && !isError

  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle>내 전자서명</CardTitle>
        <CardDescription>전자결재에 사용되는 서명 이미지</CardDescription>
        <CardAction>
          <EmpFileUploadButton empId={empId} fileType="SIGNATURE" label="이미지 첨부" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6">
          {hasSignature ? (
            <img src={objectUrl} alt="내 전자서명" className="max-h-32 max-w-full object-contain" />
          ) : (
            <>
              <FileX2 className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">내 전자서명</p>
              <p className="text-xs text-muted-foreground">[이미지가 없습니다]</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
