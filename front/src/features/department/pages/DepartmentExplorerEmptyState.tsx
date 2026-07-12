import { Network } from 'lucide-react'

/**
 * 조직도 index 라우트(부서 미선택 상태). 첫 부서로 자동 이동시키는 리다이렉트는 하지 않고,
 * 좌측 트리에서 선택하라는 안내만 보여준다.
 */
export function DepartmentExplorerEmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Network className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">조회할 부서를 선택해주세요</p>
        <p className="text-sm text-muted-foreground">
          좌측 조직도 트리에서 부서를 선택하면 상세 정보와 관리 흐름이 이곳에 표시됩니다.
        </p>
      </div>
    </div>
  )
}
