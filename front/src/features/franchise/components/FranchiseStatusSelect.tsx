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
  /** 현재 영업상태 — 조회 응답의 한글 표시명 문자열(FranchiseDetail.BusinessStatus). */
  currentStatusLabel: string
}

/**
 * 가맹점 영업상태 변경 select(F1605, `FRANCHISE_STATUS_UPDATE`, ROADMAP(FRANCHISE) T2.4-b).
 *
 * 조회는 표시명 문자열, 전송은 enum 코드 — 두 축 혼용 금지(계약 실측 메모). 현재 상태는
 * resolveBusinessStatusCode로 표시명을 코드로 역매핑해 select 값으로 쓰고, 옵션 값은
 * BUSINESS_STATUS_CODES(전송용 코드), 라벨은 BUSINESS_STATUS_LABEL(표시명)이다.
 *
 * select 값은 로컬 상태가 아니라 서버 상태(상세 캐시)에서 파생된다 — onChange 즉시 mutation을
 * 트리거하고(meeting availableFilter select 스타일), 성공 시 invalidate가 상세를 다시 내려주면
 * 그때 select 값이 바뀐다. 실패 시엔 캐시가 그대로라 select도 이전 값으로 남는다(수동 롤백 불필요).
 *
 * 계약 밖 표시명(resolveBusinessStatusCode가 undefined)은 방어적으로 빈 placeholder 옵션을
 * 노출하고, 사용자가 코드를 고르면 정상 변경 요청이 나간다(코드 발명 금지 — 표시는 그대로 둔다).
 */
export function FranchiseStatusSelect({ franchiseId, currentStatusLabel }: FranchiseStatusSelectProps) {
  const mutation = useFranchiseStatusUpdateMutation()
  const currentCode = resolveBusinessStatusCode(currentStatusLabel)

  function handleChange(nextValue: string) {
    // 옵션 value는 BUSINESS_STATUS_CODES에서만 나오므로 코드로 좁혀도 안전하다(placeholder는 disabled).
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
