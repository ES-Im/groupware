import { resolveBusinessStatusCode, type BusinessStatusCode } from '../model/franchise'
import { FranchiseStatusPill } from './FranchiseStatusPill'

const STATUS_VARIANT: Record<BusinessStatusCode, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  OPEN: 'default',
  PRE_OPEN: 'secondary',
  READY_TO_OPEN: 'secondary',
  TEMP_CLOSED: 'outline',
  CLOSED: 'destructive',
}

export function FranchiseBusinessStatusBadge({ status }: { status: string }) {
  const code = resolveBusinessStatusCode(status)
  return <FranchiseStatusPill variant={code ? STATUS_VARIANT[code] : 'outline'}>{status}</FranchiseStatusPill>
}
