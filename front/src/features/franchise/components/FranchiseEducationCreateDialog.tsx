import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { FranchiseEducationCreateForm } from './FranchiseEducationCreateForm'

interface FranchiseEducationCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 등록 성공 시 생성된 교육 식별자와 함께 호출한다(상위가 모달 닫기·상세 이동 등 후속 동작 소유). */
  onCreated: (educationId: number) => void
}

/**
 * 가맹점 교육 등록 모달(`FRANCHISE_EDUCATION_CREATE`, F1612).
 *
 * 사용자 요청으로 교육 목록(/franchise-educations)의 [교육 등록]을 전용 페이지 이동 대신 이
 * 모달로 띄운다(FranchiseEducationCreatePage 폐지 → 모달 복귀). 폼 본문은 그대로
 * FranchiseEducationCreateForm을 재사용하고, 이 모달은 다이얼로그 chrome과 "등록 시 비활성 상태로
 * 생성됨" 안내만 얹는다.
 *
 * 안내 문구 근거: 도메인모델.md "교육은 생성 시 비활성 상태로 생성된다" — 등록 직후에는 신청을
 * 받지 못하므로, 활성화가 별도 단계임을 등록 시점에 명시한다(사용자 요청).
 *
 * Radix Dialog는 닫히면 콘텐츠(=폼)를 언마운트하므로, 다시 열 때마다 폼이 초기값으로 새로
 * 마운트된다(별도 reset 불필요). 취소(onCancel)는 모달을 닫고, 성공(onSuccess)은 educationId를
 * 상위로 전달한다.
 */
export function FranchiseEducationCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: FranchiseEducationCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>교육 등록</DialogTitle>
          <DialogDescription>가맹점 교육 일정을 등록합니다.</DialogDescription>
        </DialogHeader>

        {/* 비활성 안내: 등록한 교육은 즉시 신청을 받지 못하고 활성화가 별도 단계임을 알린다. */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            등록한 교육은 <strong className="font-semibold">비활성 상태</strong>로 생성됩니다. 신청을
            받으려면 교육 상세 화면에서 활성화해주세요.
          </p>
        </div>

        <FranchiseEducationCreateForm
          onCancel={() => onOpenChange(false)}
          onSuccess={onCreated}
        />
      </DialogContent>
    </Dialog>
  )
}
