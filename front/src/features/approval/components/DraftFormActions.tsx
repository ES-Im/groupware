import { Eye, Save, Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface DraftFormActionsProps {
  /** 제출 진행 중 여부(모든 버튼 비활성). */
  isSubmitting: boolean
  /** 취소(문서함으로 이동 등) — 페이지가 배선. */
  onCancel: () => void
  /** 기안서 미리보기 모달 열기 — 페이지가 배선. */
  onPreview: () => void
  /** 임시저장으로 생성/저장 — 페이지가 배선. */
  onSaveDraft: () => void
  /**
   * 저장 버튼 문구(기본 "임시저장"). 문맥에 맞춰 덮어쓴다 — 취소기안="임시저장", 수정="저장".
   * 미리보기·상신 버튼과 달리 화면마다 동작 의미(생성 vs 갱신)가 달라 라벨을 노출한다.
   */
  saveLabel?: string
  /** 상신 버튼 문구(기본 "상신"). 취소기안="생성 후 상신" 등으로 덮어쓴다. */
  submitLabel?: string
}

/**
 * 기안서 작성/취소기안/수정 폼 하단 액션바(레퍼런스: 취소 / 미리보기 / 임시저장 / 상신, 우측 정렬).
 *
 * 순수 프레젠테이셔널 — 핸들러는 모두 props로 받아 연결만 한다. [상신]은 type=submit이라 폼의
 * onSubmit(=생성 후 상신)을 트리거하고, 나머지는 type=button으로 각 핸들러를 호출한다. 저장·상신
 * 라벨은 화면 문맥(작성/취소기안/수정)에 맞게 덮어쓸 수 있다(기본은 작성 화면 문구).
 */
export function DraftFormActions({
  isSubmitting,
  onCancel,
  onPreview,
  onSaveDraft,
  saveLabel = '임시저장',
  submitLabel = '상신',
}: DraftFormActionsProps) {
  return (
    // 레퍼런스 CardFooter 톤(상단 구분선 + muted 배경 + 우측 정렬)을 재현한다. 이 액션바는 폼 안
    // (CardContent px-4·Card pb-4 안쪽)에 있으므로 음수 마진(-mx-4/-mb-4)으로 카드 좌우·하단
    // 패딩을 상쇄해 카드 폭 전체를 채우는 푸터로 만든다(--card-spacing=4 기준). mt-auto는 카드가
    // 남는 높이만큼 늘어났을 때(폼이 짧은 화면) 액션바를 카드 하단에 고정한다 — 폼이 길면 무효과.
    <div className="-mx-4 -mb-4 mt-auto flex flex-col-reverse gap-2 rounded-b-2xl border-t bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
      <Button
        type="button"
        variant="ghost"
        className="rounded-xl"
        disabled={isSubmitting}
        onClick={onCancel}
      >
        취소
      </Button>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        disabled={isSubmitting}
        onClick={onPreview}
      >
        <Eye />
        기안서 미리보기
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="rounded-xl"
        disabled={isSubmitting}
        onClick={onSaveDraft}
      >
        <Save />
        {saveLabel}
      </Button>
      <Button type="submit" className="rounded-xl shadow-md shadow-primary/20" disabled={isSubmitting}>
        <Send />
        {submitLabel}
      </Button>
    </div>
  )
}
