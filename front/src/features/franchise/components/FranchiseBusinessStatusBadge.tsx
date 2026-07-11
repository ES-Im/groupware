import { Badge } from '@/shared/ui/badge'
import { resolveBusinessStatusCode, type BusinessStatusCode } from '../model/franchise'

/**
 * 가맹점 영업상태 뱃지(Ubold 상태 뱃지 이식).
 *
 * 조회 응답의 `BusinessStatus`는 한글 표시명 문자열이므로, resolveBusinessStatusCode로 enum
 * 코드를 되찾아 강조 수위를 shadcn Badge 변형에 매핑한다(정책상 커스텀 색 팔레트 없이
 * default/secondary/outline/destructive 4단계로만 상태를 구분). 계약 밖 표시명이면 outline으로
 * 원문을 그대로 노출한다(코드 발명 금지).
 */
const STATUS_VARIANT: Record<BusinessStatusCode, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OPEN: 'default',
  PRE_OPEN: 'secondary',
  READY_TO_OPEN: 'secondary',
  TEMP_CLOSED: 'outline',
  CLOSED: 'destructive',
}

export function FranchiseBusinessStatusBadge({ status }: { status: string }) {
  const code = resolveBusinessStatusCode(status)
  return <Badge variant={code ? STATUS_VARIANT[code] : 'outline'}>{status}</Badge>
}
