import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasRequiredRole } from '@/shared/lib/hasRequiredRole'
import { Button } from '@/shared/ui/button'
import { CategoryManagementDialog } from './CategoryManagementDialog'

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
