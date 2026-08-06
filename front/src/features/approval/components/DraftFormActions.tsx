import { Eye, Save, Send } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface DraftFormActionsProps {
  isSubmitting: boolean
  onCancel: () => void
  onPreview: () => void
  onSaveDraft: () => void
  saveLabel?: string
  submitLabel?: string
}

export function DraftFormActions({
  isSubmitting,
  onCancel,
  onPreview,
  onSaveDraft,
  saveLabel = '임시저장',
  submitLabel = '상신',
}: DraftFormActionsProps) {
  return (
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
