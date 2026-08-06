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
