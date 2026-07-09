import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

/**
 * Spring Data `Page` 메타(docs/backend-contract/page.md)의 구조적 부분집합.
 * 특정 feature의 `Page<T>` 타입(예: department의 `DeptMembersPage`)을 직접 임포트하지
 * 않는다 — 필드 구조만 맞으면(구조적 타이핑) 어떤 도메인의 페이지 응답이든 그대로 전달할
 * 수 있게 해 BOARD_LIST(T10.3)·BOARD_COMMENTS(M14) 등 다른 목록형 도메인이 재사용하기
 * 위함이다(ROADMAP T10.1, "API 형태에 종속되지 않는 범용 컴포넌트").
 */
export interface PageMeta {
  totalElements: number
  totalPages: number
  /** 0-based 현재 페이지(서버 원문 그대로). */
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
}

interface PaginationControlsProps {
  /** 서버 페이지 메타. */
  pageInfo: PageMeta
  /** 현재 페이지(0-base, pageInfo.number와 동일 값을 호출부가 별도 상태로 들고 있다가 전달). */
  page: number
  /** 페이지 이동 콜백(0-base 페이지 번호를 그대로 넘겨준다). */
  onPageChange: (page: number) => void
  /** 총 개수 뒤에 붙는 단위 명사(예: '명', '건'). 생략하면 단위 없이 숫자만 표시한다. */
  unit?: string
  className?: string
}

/** 페이지 번호 창(window) 항목: 실제 1-base 페이지 번호이거나, 생략 구간을 뜻하는 말줄임표. */
type PageWindowItem = number | 'ellipsis'

/**
 * 표시할 1-base 페이지 번호 창을 계산한다. 전체 페이지가 적으면(≤7) 모두 나열하고, 많으면
 * 현재 페이지 주변(±1)과 첫/끝 페이지만 남기고 사이를 말줄임표로 접는다. 순수 파생 계산이라
 * 상태/로직에 영향을 주지 않는다(부서·근태·댓글 등 공유 소비처 전반에서 동일하게 동작).
 */
function buildPageWindow(current: number, total: number): PageWindowItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const items: PageWindowItem[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) {
    items.push('ellipsis')
  }
  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }
  if (end < total - 1) {
    items.push('ellipsis')
  }
  items.push(total)
  return items
}

/**
 * Page 메타 기반 공유 페이징 컨트롤(ROADMAP T10.1).
 * 좌측 'A-B / 총계{unit}' 범위 요약 + 우측 컴팩트 페이저(이전 아이콘 · 번호 버튼 · 다음 아이콘)로
 * 구성된다. 번호 버튼은 현재 페이지만 채운(default) 상태로 강조하고 나머지는 ghost로 두며,
 * 페이지가 많을 때는 buildPageWindow가 첫/끝과 현재 주변만 남기고 말줄임표로 접는다.
 *
 * 최초 추출 지점은 DepartmentDetailView(부서 상세 멤버 페이징)이며, 이후 목록형 도메인이 그대로
 * 복제해 사용한다 — props 구조(pageInfo/page/onPageChange/unit/className)는 소비처 전반의 계약이라
 * 유지하고, 이 리파인에서는 시각 표현만 컴팩트하게 다듬었다.
 */
export function PaginationControls({
  pageInfo,
  page,
  onPageChange,
  unit = '',
  className,
}: PaginationControlsProps) {
  // totalElements가 0이면 범위 표기도 0으로 고정한다(빈 목록에서 '1-0 표시' 같은 어색한 문구 방지).
  const rangeStart = pageInfo.totalElements === 0 ? 0 : pageInfo.number * pageInfo.size + 1
  const rangeEnd = pageInfo.number * pageInfo.size + pageInfo.numberOfElements
  // totalPages가 0(빈 목록)이어도 'N / 0'이 아니라 'N / 1'로 표시한다(기존 동작 유지).
  const totalPages = pageInfo.totalPages || 1
  const currentPage = pageInfo.number + 1
  const pageWindow = buildPageWindow(currentPage, totalPages)

  return (
    <nav
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      aria-label="페이지 이동"
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        {rangeStart}-{rangeEnd} / {pageInfo.totalElements}
        {unit}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={pageInfo.first}
          onClick={() => onPageChange(page - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft />
        </Button>
        {pageWindow.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm text-muted-foreground select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === currentPage ? 'default' : 'ghost'}
              size="icon-sm"
              className="tabular-nums"
              aria-label={`${item} 페이지`}
              aria-current={item === currentPage ? 'page' : undefined}
              // 0-base로 환산해 콜백에 넘긴다(호출부는 0-base 상태를 유지).
              onClick={() => onPageChange(item - 1)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={pageInfo.last}
          onClick={() => onPageChange(page + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}
