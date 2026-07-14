import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import type { CategoryItem } from '@/features/category/model/category'
import { boardEditSchema, type BoardEditFormValues } from '../model/boardEditSchema'
import type { BoardUpdateRequest } from '../model/board'

/**
 * "취소" 버튼 동작. 전용 수정 페이지(BoardEditPage)는 유효 경로로 되돌아가는 Link(`link`)를,
 * 목록 인라인 편집(BoardCreateForm)은 라우트 이동 없이 create 모드로 되돌리는 콜백(`button`)을
 * 각각 주입한다 — 인라인 컨텍스트에서 Link로 이동해버리면 인라인 편집의 의미가 사라지기 때문이다.
 */
type BoardEditCancel =
  | { type: 'link'; path: string }
  | { type: 'button'; onClick: () => void }

/**
 * 편집 폼 자체(카테고리/제목/본문/첨부 + 저장). editModeQuery.data가 확정된 뒤에만 부모
 * (BoardEditPage/BoardCreateForm)가 이 컴포넌트를 마운트한다 — UpdateMePage/UpdateMeForm과
 * 동일하게 RHF가 마운트 시점의 defaultValues를 그대로 신뢰하도록 해, 데이터 도착 후 수동 reset()을
 * 두지 않는다.
 *
 * **레이아웃은 게시글 작성 폼(BoardCreateForm)과 동일하게 통일한다(사용자 요청)**: 카테고리는
 * "카테고리 : [고정너비 select]" 인라인, 본문 Textarea는 flex-1로 남는 높이를 흡수(+resize-y로
 * 사용자 조절)해 하단 액션바가 카드 최하단에 붙는다. 첨부(BoardEditAttachments)는 작성 폼처럼 본문과
 * 액션바 사이에 오도록 `attachmentsSlot`으로 주입받는다. 다만 작성 폼과 달리 버튼은 [취소][저장]만
 * 두고(임시저장글 불러오기·임시저장 제외), 저장 동작은 기존 BOARD_UPDATE(dirtyFields+modifiedAt)를
 * 그대로 유지한다.
 *
 * `getModifiedAt`은 부모가 매 렌더 시점의 최신 detailQuery 상태로 계산해 내려주는 게터다 —
 * 저장 시점에 호출해 그 순간 확정된 modifiedAt(또는 초안 폴백값)을 읽는다. `isModifiedAtReady`가
 * false인 동안 저장 버튼을 비활성화해, 아직 값이 정해지지 않은 상태로 제출되는 것을 막는다.
 */
export function BoardEditForm({
  cancel,
  categories,
  defaultValues,
  attachmentsSlot,
  getModifiedAt,
  isModifiedAtReady,
  onSubmitPayload,
}: {
  cancel: BoardEditCancel
  categories: CategoryItem[]
  defaultValues: BoardEditFormValues
  /**
   * 본문과 하단 액션바 사이에 끼워 넣을 첨부 섹션(BoardEditAttachments flat). 작성 폼과 동일하게
   * 첨부가 액션바 바로 위에 오도록 슬롯으로 받는다(미주입 시 첨부 영역 없이 렌더).
   */
  attachmentsSlot?: ReactNode
  getModifiedAt: () => string | undefined
  isModifiedAtReady: boolean
  onSubmitPayload: (payload: BoardUpdateRequest) => Promise<void>
}) {
  const form = useZodForm(boardEditSchema, { defaultValues })
  const {
    register,
    formState: { errors, isSubmitting, dirtyFields },
  } = form

  async function submit(values: BoardEditFormValues) {
    const modifiedAt = getModifiedAt()
    if (modifiedAt === undefined) {
      // 저장 버튼이 이 상태에서는 비활성화돼 있어야 하지만 방어적으로 한번 더 막는다.
      toast.error('저장 준비 중입니다. 잠시 후 다시 시도해주세요')
      return
    }

    // 변경 필드만 전송(PATCH 시맨틱) — dirtyFields로 실제로 값을 바꾼 필드만 payload에 포함한다.
    const payload: BoardUpdateRequest = { modifiedAt }
    if (dirtyFields.categoryId) {
      payload.categoryId = Number(values.categoryId)
    }
    if (dirtyFields.title) {
      payload.title = values.title
    }
    if (dirtyFields.content) {
      payload.content = values.content
    }

    if (payload.categoryId === undefined && payload.title === undefined && payload.content === undefined) {
      toast.error('변경된 내용이 없습니다')
      return
    }

    await onSubmitPayload(payload)
  }

  const submitEdit = submitWithErrorMapping(form, submit)

  return (
    <form
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-1 flex-col gap-4"
    >
      {/* 카테고리: 작성 폼과 동일하게 "카테고리 : [고정너비 select]" 인라인 배치. */}
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="board-edit-category" className="shrink-0">
          카테고리 <span className="text-destructive">*</span>
        </Label>
        <select
          id="board-edit-category"
          aria-invalid={!!errors.categoryId}
          disabled={categories.length === 0}
          className="h-8 w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('categoryId')}
        >
          <option value="">카테고리 선택</option>
          {categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p role="alert" className="w-full text-sm text-destructive">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="board-edit-title">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="board-edit-title"
          placeholder="제목을 입력해주세요"
          maxLength={50}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* 본문: 작성 폼과 동일하게 flex-1로 남는 높이를 흡수(+resize-y)해 액션바를 하단으로 민다. */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="board-edit-content">
          본문 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="board-edit-content"
          placeholder="본문을 입력해주세요"
          className="min-h-48 flex-1 resize-y"
          aria-invalid={!!errors.content}
          {...register('content')}
        />
        {errors.content && (
          <p role="alert" className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      {/* 첨부 섹션(부모가 BoardEditAttachments를 주입) — 작성 폼처럼 본문과 액션바 사이에 온다. */}
      {attachmentsSlot}

      {/* 액션바: 작성 폼과 동일한 톤(bg-muted/50 rounded 바)이되 버튼은 [취소][저장]만 우측 정렬.
          cancel은 소비처가 컨텍스트에 맞게 주입한다(전용 수정 페이지=유효 경로 Link, 목록 인라인
          편집=create 모드 복귀 버튼). */}
      <div className="mt-2 flex flex-col-reverse gap-3 rounded-xl border bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-end">
        {cancel.type === 'link' ? (
          <Button asChild variant="outline">
            <Link to={cancel.path}>취소</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={cancel.onClick}>
            취소
          </Button>
        )}
        <Button
          type="button"
          className="font-semibold"
          disabled={isSubmitting || !isModifiedAtReady}
          onClick={() => void submitEdit()}
        >
          <Save />
          저장
        </Button>
      </div>
    </form>
  )
}
