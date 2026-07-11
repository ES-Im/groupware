import { FileX2 } from 'lucide-react'
import { getActiveSignature } from '@/shared/lib/activeFiles'
import { useEmpFilePreviewUrl } from '@/shared/lib/useEmpFilePreview'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmpFileUploadButton } from './EmpFileUploadButton'
import type { ActiveFile } from '../model/me'

interface SignatureCardProps {
  /** 사원 식별 번호. 미확정이면 업로드 버튼이 비활성화된다(EmpFileUploadButton 참고). */
  empId: number | undefined
  activeFiles: ActiveFile[]
}

/**
 * "내 전자서명" 카드(MyInfoPage 전용, adapt-ui 리디자인 신규).
 *
 * 활성 SIGNATURE 파일을 EMP_FILE_PREVIEW(useEmpFilePreviewUrl)로 미리보기하고, 업로드 버튼
 * (EmpFileUploadButton, fileType=SIGNATURE)으로 새 서명 이미지를 첨부한다. 도메인 규칙(같은
 * 타입은 하나만 활성화 가능, 새 파일 등록 시 기존 파일 자동 비활성화)에 따라 업로드하면 즉시
 * 이 미리보기가 새 서명으로 갱신된다(useEmpFileUploadMutation이 employeeKeys.me() invalidate).
 *
 * 활성 서명이 없으면 레퍼런스와 동일하게 빈 상태([이미지가 없습니다])를 보여준다.
 */
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
