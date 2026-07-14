import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { Button } from '@/shared/ui/button'
import { CategoryManagementDialog } from './CategoryManagementDialog'

/**
 * 게시판 좌측 "카테고리" 카드 헤더에 얹는 "관리" 버튼 + 모달 트리거.
 *
 * 카테고리 관리 6개 엔드포인트(CATEGORY_MANAGEMENT/REGISTER/UPDATE_NAME/ACTIVATE/DEACTIVATE)는
 * 전부 minRole ADMIN이다(api-endpoint.md 150~155행) — BoardDetailView의
 * `canEdit = hasRequiredRole(roles, 'ADMIN')` 선례를 그대로 복제해 비-ADMIN에게는 버튼 자체를
 * 렌더하지 않는다(null 반환). BoardListPage는 이 컴포넌트 하나만 렌더하면 되므로, 버튼 노출
 * 게이팅과 모달 open 상태 배선이 이 컴포넌트 안에 캡슐화된다.
 */
export function CategoryManagementTrigger() {
  const roles = useAuthStore((state) => state.roles)
  const canManage = hasRequiredRole(roles, 'ADMIN')
  const [open, setOpen] = useState(false)

  if (!canManage) {
    return null
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings2 />
        관리
      </Button>
      <CategoryManagementDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
