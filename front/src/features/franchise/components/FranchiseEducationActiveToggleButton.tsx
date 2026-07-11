import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
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
import { Button } from '@/shared/ui/button'
import { useFranchiseEducationActivateMutation } from '../api/useFranchiseEducationActivateMutation'
import { useFranchiseEducationDeactivateMutation } from '../api/useFranchiseEducationDeactivateMutation'

interface FranchiseEducationActiveToggleButtonProps {
  educationId: number
  isActive: boolean
}

/**
 * 교육 상세의 활성/비활성 토글 확인 버튼(`FRANCHISE_EDUCATION_ACTIVATE`/`_DEACTIVATE`, F1614,
 * ROADMAP(FRANCHISE) T4.4). MeetingRoomActiveToggleButton과 동형 AlertDialog 확인 패턴이되,
 * 표 행이 아닌 상세 페이지 버튼이라 stopPropagation 래퍼는 두지 않는다(행 내비게이션 없음).
 * 등록자 본인 판정은 서버 403 전담(Open Q#6) — 위반 시 handleApiError 토스트로만 처리한다.
 */
export function FranchiseEducationActiveToggleButton({
  educationId,
  isActive,
}: FranchiseEducationActiveToggleButtonProps) {
  const activateMutation = useFranchiseEducationActivateMutation()
  const deactivateMutation = useFranchiseEducationDeactivateMutation()
  const mutation = isActive ? deactivateMutation : activateMutation

  function handleToggle() {
    mutation.mutate(educationId, {
      onSuccess: () => {
        toast.success(isActive ? '교육을 비활성화했습니다' : '교육을 활성화했습니다')
      },
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {isActive ? '비활성화' : '활성화'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? '교육을 비활성화하시겠습니까?' : '교육을 활성화하시겠습니까?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? '비활성화하면 가맹점이 이 교육을 신청할 수 없습니다.'
              : '활성화하면 가맹점이 이 교육을 다시 신청할 수 있습니다.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>돌아가기</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle} disabled={mutation.isPending}>
            {mutation.isPending ? '처리 중...' : isActive ? '비활성화' : '활성화'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
