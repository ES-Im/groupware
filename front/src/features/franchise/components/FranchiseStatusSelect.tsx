import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { useFranchiseStatusUpdateMutation } from '../api/useFranchiseStatusUpdateMutation'
import {
  BUSINESS_STATUS_CODES,
  BUSINESS_STATUS_LABEL,
  resolveBusinessStatusCode,
  type BusinessStatusCode,
} from '../model/franchise'

interface FranchiseStatusSelectProps {
  franchiseId: number
  currentStatusLabel: string
}

export function FranchiseStatusSelect({ franchiseId, currentStatusLabel }: FranchiseStatusSelectProps) {
  const mutation = useFranchiseStatusUpdateMutation()
  const currentCode = resolveBusinessStatusCode(currentStatusLabel)

  function handleChange(nextValue: string) {
    const nextCode = nextValue as BusinessStatusCode
    if (nextCode === currentCode) {
      return
    }
    mutation.mutate(
      { franchiseId, status: nextCode },
      {
        onSuccess: () => {
          toast.success('영업상태를 변경했습니다')
        },
        onError: (error) => {
          handleApiError(error, { toast })
        },
      },
    )
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="franchise-status-select" className="text-xs text-muted-foreground">
        영업상태 변경
      </label>
      <select
        id="franchise-status-select"
        value={currentCode ?? ''}
        onChange={(event) => handleChange(event.target.value)}
        disabled={mutation.isPending}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {currentCode === undefined && (
          <option value="" disabled>
            상태 선택
          </option>
        )}
        {BUSINESS_STATUS_CODES.map((code) => (
          <option key={code} value={code}>
            {BUSINESS_STATUS_LABEL[code]}
          </option>
        ))}
      </select>
    </div>
  )
}
