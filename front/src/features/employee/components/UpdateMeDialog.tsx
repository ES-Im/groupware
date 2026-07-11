import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useUpdateMeMutation } from '../api/useUpdateMeMutation'
import { UpdateMeForm } from './UpdateMeForm'
import type { UpdateMeFormValues } from '../model/updateMeSchema'

interface UpdateMeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** useMeQuery 현재 데이터의 extensionNo(UpdateMeForm 프리필용). MyInfoPage가 그대로 주입한다. */
  defaultExtensionNo: string
}

/**
 * 내 정보 수정 다이얼로그(F005 UPDATE_SELF_INFO, adapt-ui 리디자인 — 페이지 이동(`/me/edit`) 대신
 * 모달로 전환). UpdateMePage가 하던 컨테이너 역할(useUpdateMeMutation 연결·성공 토스트)을 그대로
 * 옮기되, 성공 후에는 라우트 이동 대신 다이얼로그를 닫기만 한다 — 같은 화면(MyInfoPage)의
 * useMeQuery 캐시가 employeeKeys.me() invalidate로 자동 재검증되므로 별도 네비게이션이 불필요하다.
 */
export function UpdateMeDialog({ open, onOpenChange, defaultExtensionNo }: UpdateMeDialogProps) {
  const updateMeMutation = useUpdateMeMutation()

  async function handleSubmit(values: UpdateMeFormValues) {
    await updateMeMutation.mutateAsync(values)
    toast.success('내 정보를 수정했습니다')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>내 정보 수정</DialogTitle>
          <DialogDescription>내선번호와 비밀번호를 수정합니다.</DialogDescription>
        </DialogHeader>
        {/* key로 열릴 때마다 새 인스턴스를 강제해, 이전에 입력하다 취소한 비밀번호 등 잔여
            입력값이 다음 오픈까지 남지 않도록 한다(HrManagedInfoDialog의 reset-on-open과 동일 목적,
            UpdateMeForm은 내부에서 useForm을 직접 소유해 외부 reset을 받지 않으므로 key로 재마운트). */}
        <UpdateMeForm key={String(open)} defaultExtensionNo={defaultExtensionNo} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
