import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { CategoryManagementPanel } from './CategoryManagementPanel'

interface CategoryManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryManagementDialog({ open, onOpenChange }: CategoryManagementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>카테고리 관리</DialogTitle>
          <DialogDescription>
            게시판 카테고리를 등록하거나 이름을 바꾸고, 노출 여부를 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <CategoryManagementPanel />
      </DialogContent>
    </Dialog>
  )
}
