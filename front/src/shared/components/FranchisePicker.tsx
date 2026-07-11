import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useFranchisesQuery } from '@/features/franchise/api/useFranchisesQuery'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'

/** 가맹점 검색 디바운스 지연(ms). EmployeePicker(department 도메인)와 동일 값. */
const SEARCH_DEBOUNCE_MS = 300

/** 넉넉한 단일 페이지 크기(§FranchisePicker 설계, EmployeePicker memberPageSize 동형). */
const PAGE_SIZE = 50

/** FranchisePicker의 선택 단위. 소비처(작성/수정 폼)가 franchiseId/franchiseName으로 매핑한다. */
export interface FranchisePickerSelection {
  id: number
  name: string
}

interface FranchisePickerProps {
  /** 현재 선택된 가맹점(제어형 — 소유·유지는 소비처). 미선택은 null. */
  selected: FranchisePickerSelection | null
  /** 선택 변경 콜백. 이미 선택된 행을 다시 누르면 null로 해제된다. */
  onChange: (next: FranchisePickerSelection | null) => void
}

/**
 * 매출 기안 작성/수정 폼의 대상 가맹점 선택 위젯(F762, ROADMAP(SALES) T1.2, PRD §FranchisePicker 설계).
 *
 * `EmployeePicker`(부서→부서원 2단 탐색·다중 선택)를 **단일 목록·단일 선택**으로 치환 복제한다.
 * 가맹점은 부서처럼 상위 탐색 축이 없고 `FRANCHISE_LIST`가 이미 담당자 필터(`managerId`)를
 * 지원하므로, "담당 가맹점 기본뷰 ↔ keyword 전체 검색" 두 모드를 단일 목록 하나로 전환한다
 * (2단 탐색 UI 불필요).
 *
 * 기본 뷰: 마운트 시 `managerId`=본인 empId(`useMeQuery`)로 담당 가맹점을 우선 노출한다.
 * 서버가 담당 여부를 강제하지 않으므로(§권한 분기점) 이는 UX 편의일 뿐이다. 본인 empId가
 * 아직 없으면(로딩 중/조회 실패) `managerId`를 보내지 않아(getFranchises 조건부 채움) 자동으로
 * 검색 모드와 동일하게 fail-closed 동작한다(담당 필터 미적용).
 *
 * 검색 모드: `keyword` 입력(디바운스 300ms) 시 `managerId`를 제거하고 전체 가맹점에서 검색한다.
 * 담당 외 가맹점도 선택 허용(서버는 임의 franchiseId를 허용, findById로 존재만 검증).
 *
 * 제어형(controlled): 선택 상태(`selected`)의 소유·유지는 소비처가 하고, 이 컴포넌트는 탐색
 * UI·토글만 담당한다(EmployeePicker와 동일 계약).
 */
export function FranchisePicker({ selected, onChange }: FranchisePickerProps) {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')

  // 검색 입력 디바운스(EmployeePicker와 동일 패턴): 300ms 유예 후에만 확정된 keyword를 쿼리에
  // 반영해 키 입력마다 FRANCHISE_LIST 요청이 발생하는 것을 막는다.
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === keyword) {
      return
    }
    const timer = setTimeout(() => setKeyword(trimmed), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  const meQuery = useMeQuery()
  const meEmpId = meQuery.data?.empBasicInfo.empId
  const isSearching = keyword.length > 0

  const franchisesQuery = useFranchisesQuery(
    isSearching ? { keyword, size: PAGE_SIZE } : { managerId: meEmpId, size: PAGE_SIZE },
  )

  const franchises = franchisesQuery.data?.content ?? []
  // 담당 가맹점 기본뷰가 빈 결과일 때만 안내한다(검색 모드에서 결과가 없는 것과는 다른 메시지).
  const showManagedEmptyState =
    !isSearching && meEmpId != null && !franchisesQuery.isLoading && franchises.length === 0

  function isSelected(id: number) {
    return selected?.id === id
  }

  function toggle(franchise: { id: number; name: string }) {
    if (isSelected(franchise.id)) {
      onChange(null)
      return
    }
    onChange({ id: franchise.id, name: franchise.name })
  }

  return (
    <div className="space-y-1.5">
      {selected && (
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs text-foreground">
            {selected.name}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`${selected.name} 선택 해제`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        </div>
      )}

      <Input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="가맹점명·주소 검색"
        aria-label="가맹점 검색"
      />

      <div className="h-48 overflow-y-auto rounded-lg border p-1">
        {franchisesQuery.isLoading ? (
          <p className="p-2 text-xs text-muted-foreground">가맹점을 불러오는 중...</p>
        ) : showManagedEmptyState ? (
          <p className="p-2 text-xs text-muted-foreground">
            담당 가맹점이 없습니다. 이름·주소로 검색해 선택하세요.
          </p>
        ) : franchises.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">검색 결과가 없습니다.</p>
        ) : (
          <ul className="space-y-0.5">
            {franchises.map((franchise) => {
              const checked = isSelected(franchise.id)
              return (
                <li key={franchise.id}>
                  <button
                    type="button"
                    onClick={() => toggle(franchise)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                      checked && 'bg-accent',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border',
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                      )}
                    >
                      {checked && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{franchise.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {franchise.BusinessStatus} · {franchise.ownerName} · {franchise.address}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {/* 검색으로 좁히도록 유도: 결과가 한 페이지를 넘으면 안내(페이지네이션은 MVP 범위 밖). */}
      {franchisesQuery.data && !franchisesQuery.data.last && (
        <p className="text-xs text-muted-foreground">결과가 많습니다. 검색해 좁혀주세요.</p>
      )}
    </div>
  )
}
