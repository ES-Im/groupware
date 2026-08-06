import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useUpdateMeMutation } from '../api/useUpdateMeMutation'
import { UpdateMeForm } from './UpdateMeForm'
import type { UpdateMeFormValues } from '../model/updateMeSchema'

interface UpdateMeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultExtensionNo: string
}

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
        <UpdateMeForm key={String(open)} defaultExtensionNo={defaultExtensionNo} onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  )
}
