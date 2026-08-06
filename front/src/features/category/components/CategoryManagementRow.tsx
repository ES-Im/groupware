import { useState } from 'react'
import { Eye, EyeOff, Pencil } from 'lucide-react'
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
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useCategoryActivateMutation } from '../api/useCategoryActivateMutation'
import { useCategoryDeactivateMutation } from '../api/useCategoryDeactivateMutation'
import { useCategoryUpdateNameMutation } from '../api/useCategoryUpdateNameMutation'
import type { CategoryItem } from '../model/category'
import type { CategoryNameFormValues } from '../model/categorySchema'
import { CategoryNameForm } from './CategoryNameForm'

interface CategoryManagementRowProps {
  category: CategoryItem
}

export function CategoryManagementRow({ category }: CategoryManagementRowProps) {
  const [isEditing, setIsEditing] = useState(false)

  const updateNameMutation = useCategoryUpdateNameMutation()
  const activateMutation = useCategoryActivateMutation()
  const deactivateMutation = useCategoryDeactivateMutation()

  async function handleRename(values: CategoryNameFormValues) {
    await updateNameMutation.mutateAsync({
      categoryId: category.categoryId,
      categoryName: values.categoryName,
    })
    toast.success('카테고리명을 변경했습니다')
    setIsEditing(false)
  }

  function handleActivate() {
    activateMutation.mutate(category.categoryId, {
      onSuccess: () => toast.success('카테고리를 노출했습니다'),
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  function handleDeactivate() {
    deactivateMutation.mutate(category.categoryId, {
      onSuccess: () => toast.success('카테고리를 숨겼습니다'),
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-border bg-card p-3">
        <CategoryNameForm
          initialName={category.categoryName}
          submitLabel="저장"
          onCancel={() => setIsEditing(false)}
          onSubmit={handleRename}
          autoFocus
        />
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium text-foreground">{category.categoryName}</span>
        <Badge variant={category.isVisible ? 'default' : 'secondary'}>
          {category.isVisible ? '노출' : '숨김'}
        </Badge>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsEditing(true)}
          title="이름수정"
        >
          <Pencil />
          <span className="sr-only">이름수정</span>
        </Button>
        {category.isVisible ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={deactivateMutation.isPending}
                title="숨기기"
              >
                <EyeOff />
                <span className="sr-only">숨기기</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>카테고리를 숨기시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  숨긴 카테고리는 게시판 카테고리 목록과 게시글 작성 폼에서 제외됩니다. 언제든
                  다시 노출할 수 있습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate}>숨기기</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleActivate}
            disabled={activateMutation.isPending}
            title="노출하기"
          >
            <Eye />
            <span className="sr-only">노출하기</span>
          </Button>
        )}
      </div>
    </li>
  )
}
