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

/**
 * 카테고리 관리 목록 한 행(`CATEGORY_UPDATE_NAME`/`CATEGORY_ACTIVATE`/`CATEGORY_DEACTIVATE`,
 * ADMIN 전용). CommentItem(board 도메인)의 isEditing 토글 패턴을 그대로 복제한다 — 평상시에는
 * 이름+노출배지+액션 버튼을, "이름수정" 클릭 시 같은 자리를 공용 CategoryNameForm으로 교체한다.
 *
 * 하드 삭제 엔드포인트는 계약에 없다(toggleCategoryVisibility.ts 주석 참조) — "삭제"는 숨김
 * (비활성화)으로 매핑한다. 숨김은 되돌릴 수 있는 동작이라 되돌리기(노출)는 확인 없이 즉시
 * 실행하고, 숨기기만 AlertDialog로 한 번 더 확인한다(CommentItem 삭제 확인 선례와 동일 컴포넌트
 * 재사용 — 다만 완전 삭제로 오인하지 않도록 "언제든 다시 노출할 수 있다"를 설명에 명시한다).
 */
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
