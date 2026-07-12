import { Eye, Save, Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface DraftFormActionsProps {
  /** 제출 진행 중 여부(모든 버튼 비활성). */
  isSubmitting: boolean
  /** 취소(문서함으로 이동 등) — 페이지가 배선. */
  onCancel: () => void
  /** 기안서 미리보기 모달 열기 — 페이지가 배선. */
  onPreview: () => void
  /** 임시저장으로 생성 — 페이지가 배선. */
  onSaveDraft: () => void
}

/**
 * 기안서 작성 폼 하단 액션바(레퍼런스: 취소 / 미리보기 / 임시저장 / 상신, 우측 정렬).
 *
 * 순수 프레젠테이셔널 — 핸들러는 모두 props로 받아 연결만 한다. [상신]은 type=submit이라 폼의
 * onSubmit(=생성 후 상신)을 트리거하고, 나머지는 type=button으로 각 핸들러를 호출한다.
 */
export function DraftFormActions({
  isSubmitting,
  onCancel,
  onPreview,
  onSaveDraft,
}: DraftFormActionsProps) {
  return (
    // 레퍼런스 CardFooter 톤(상단 구분선 + muted 배경 + 우측 정렬)을 재현한다. 이 액션바는 폼 안
    // (CardContent px-4·Card pb-4 안쪽)에 있으므로 음수 마진(-mx-4/-mb-4)으로 카드 좌우·하단
    // 패딩을 상쇄해 카드 폭 전체를 채우는 푸터로 만든다(--card-spacing=4 기준). mt-auto는 카드가
    // 남는 높이만큼 늘어났을 때(폼이 짧은 화면) 액션바를 카드 하단에 고정한다 — 폼이 길면 무효과.
    <div className="-mx-4 -mb-4 mt-auto flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
      <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
        취소
      </Button>
      <Button type="button" variant="outline" disabled={isSubmitting} onClick={onPreview}>
        <Eye />
        기안서 미리보기
      </Button>
      <Button type="button" variant="outline" disabled={isSubmitting} onClick={onSaveDraft}>
        <Save />
        임시저장
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        <Send />
        상신
      </Button>
    </div>
  )
}
