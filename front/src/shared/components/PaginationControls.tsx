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

/**
 * Page 메타 기반 공유 페이징 컨트롤(ROADMAP T10.1).
 * 이전/다음 버튼(disabled은 pageInfo.first/last) + 'N / totalPages' + '총 X{unit} 중
 * A-B 표시' 범위 문구로 구성된다.
 *
 * 최초 추출 지점은 DepartmentDetailView(부서 상세 멤버 페이징, 기존 인라인 JSX를 그대로
 * 이전한 것 — 시각적/동작적 변경 없음)이며, 이후 목록형 도메인이 그대로 복제해 사용한다.
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

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        총 {pageInfo.totalElements}
        {unit} 중 {rangeStart}-{rangeEnd} 표시
      </p>
      <nav className="flex items-center gap-2" aria-label="페이지 이동">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pageInfo.first}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
          이전
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {pageInfo.number + 1} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pageInfo.last}
          onClick={() => onPageChange(page + 1)}
        >
          다음
          <ChevronRight />
        </Button>
      </nav>
    </div>
  )
}
