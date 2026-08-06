import { useState } from 'react'
import { Ban, UserCheck, UserX } from 'lucide-react'
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
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useActivateEmpMutation } from '../api/useActivateEmpMutation'
import { useResignEmpMutation } from '../api/useResignEmpMutation'
import { useSuspendEmpMutation } from '../api/useSuspendEmpMutation'
import type { EmpStatus } from '../model/empManagement'

interface EmpStatusActionButtonsProps {
  empId: number
  status: EmpStatus
}

export function EmpStatusActionButtons({ empId, status }: EmpStatusActionButtonsProps) {
  const activateMutation = useActivateEmpMutation()
  const suspendMutation = useSuspendEmpMutation()
  const resignMutation = useResignEmpMutation()
  const [resignAt, setResignAt] = useState(() => new Date().toISOString().slice(0, 10))

  function handleActivate() {
    activateMutation.mutate(empId, {
      onSuccess: () => toast.success('사원을 활성화했습니다'),
      onError: (error) => handleApiError(error, { toast }),
    })
  }

  function handleSuspend() {
    suspendMutation.mutate(empId, {
      onSuccess: () => toast.success('사원을 정직 처리했습니다'),
      onError: (error) => handleApiError(error, { toast }),
    })
  }

  function handleResign() {
    resignMutation.mutate(
      { empId, resignAt },
      {
        onSuccess: () => toast.success('사원을 퇴직 처리했습니다'),
        onError: (error) => handleApiError(error, { toast }),
      },
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={status === 'ACTIVE'}>
            <UserCheck />
            활성화
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사원을 활성화하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>활성화하면 사원이 다시 재직 상태로 전환됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activateMutation.isPending}>돌아가기</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={activateMutation.isPending}>
              {activateMutation.isPending ? '처리 중...' : '활성화'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={status === 'SUSPENDED'}>
            <Ban />
            정직
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사원을 정직 처리하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>정직 처리하면 사원이 일시적으로 업무에서 배제됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspendMutation.isPending}>돌아가기</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={suspendMutation.isPending}>
              {suspendMutation.isPending ? '처리 중...' : '정직'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="sm" disabled={status === 'RESIGNED'}>
            <UserX />
            퇴직
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사원을 퇴직 처리하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>퇴직 처리는 되돌릴 수 없습니다. 퇴직일을 입력해주세요.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emp-resign-at">퇴직일</Label>
            <Input
              id="emp-resign-at"
              type="date"
              value={resignAt}
              onChange={(event) => setResignAt(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resignMutation.isPending}>돌아가기</AlertDialogCancel>
            <AlertDialogAction onClick={handleResign} disabled={resignMutation.isPending}>
              {resignMutation.isPending ? '처리 중...' : '퇴직'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
