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

/**
 * 카테고리 관리 모달(`CATEGORY_MANAGEMENT` 등 6개 엔드포인트, ADMIN 전용, api-endpoint.md
 * 150~155행). 게시판 목록(BoardListPage) 좌측 "카테고리" 카드 헤더의 "관리" 버튼
 * (CategoryManagementTrigger)에서 연다.
 *
 * FranchiseEducationCreateDialog와 동일하게 이 컴포넌트는 Dialog chrome(제목/설명)만 소유하고,
 * 실제 검색·등록·행별 이름수정/노출토글은 CategoryManagementPanel이 캡슐화한다 — Radix Dialog가
 * 닫힐 때 DialogContent의 children을 언마운트해주므로 Panel의 검색어/필터/페이지 상태는 모달을
 * 다시 열 때마다 자동으로 초기화된다.
 */
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
