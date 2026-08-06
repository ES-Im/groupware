import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useFranchisesQuery } from '@/features/franchise/api/useFranchisesQuery'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'

const SEARCH_DEBOUNCE_MS = 300

const PAGE_SIZE = 50

export interface FranchisePickerSelection {
  id: number
  name: string
}

interface FranchisePickerProps {
  selected: FranchisePickerSelection | null
  onChange: (next: FranchisePickerSelection | null) => void
}

export function FranchisePicker({ selected, onChange }: FranchisePickerProps) {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')

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
      {franchisesQuery.data && !franchisesQuery.data.last && (
        <p className="text-xs text-muted-foreground">결과가 많습니다. 검색해 좁혀주세요.</p>
      )}
    </div>
  )
}
