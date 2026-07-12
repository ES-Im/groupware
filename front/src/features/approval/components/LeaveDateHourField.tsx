import { Label } from '@/shared/ui/label'
import { LEAVE_DAY_END_HOUR, LEAVE_DAY_START_HOUR } from '../lib/leaveHours'
import { DatePickerField } from './DatePickerField'

/**
 * 시(hour) 옵션 09~18(회사 근무시간 — lib/leaveHours.ts 상수, 백엔드 DRAFT_008 "휴가 시간은
 * 회사 근무시간 내에서만" 미러). 연가는 1시간 단위 사용이라 분 선택 자체를 제공하지 않는다.
 */
const HOUR_OPTIONS = Array.from(
  { length: LEAVE_DAY_END_HOUR - LEAVE_DAY_START_HOUR + 1 },
  (_, index) => String(LEAVE_DAY_START_HOUR + index).padStart(2, '0'),
)

/**
 * 날짜(`yyyy-MM-dd`)+시(`HH`) 분리 입력을 zod 필드 값(`yyyy-MM-ddTHH:00`)으로 조합한다.
 * 한쪽이라도 비면 미완성으로 보고 빈 문자열을 반환한다(스키마의 "입력해주세요" 검증에 위임).
 */
export function composeLeaveAt(date: string, hour: string): string {
  return date && hour ? `${date}T${hour}:00` : ''
}

interface LeaveDateHourFieldProps {
  /** date input id(라벨 htmlFor 연결 대상). */
  id: string
  /** 필드 라벨(예: 휴가 시작 일시). */
  label: string
  /** 시간 select 접근 이름(예: 휴가 시작 시간 — date input과 별도 컨트롤이라 개별 이름 필요). */
  hourAriaLabel: string
  /** 날짜 값(`yyyy-MM-dd`, 미선택은 빈 문자열). */
  dateValue: string
  /** 시간 값(`HH` 2자리, 미선택은 빈 문자열). */
  hourValue: string
  /** date input min(과거/역전 차단 — 페이지가 오늘·시작일을 넘긴다). */
  minDate?: string
  /** zod 검증 에러 메시지(페이지의 errors.startAt/endAt 메시지 그대로). */
  error?: string
  /** 표시 전용 모드(값은 보여주되 직접 선택은 막는다). */
  disabled?: boolean
  /**
   * 시각 옵션 제한(기본은 근무시간 09~18 전체). 4시간 단위 유형은 반차 경계만 넘긴다
   * (시작 09/13, 종료 13/18 — lib/leaveHours.ts). 현재 값이 옵션 밖이면(수정 폼의 기존
   * 데이터 등) 그 값을 보존 옵션으로 함께 렌더해 표시가 비지 않게 한다.
   */
  hourOptions?: readonly string[]
  /** 날짜·시간 어느 쪽이 바뀌어도 최신 조합을 통째로 알린다(조합·클램프는 페이지 책임). */
  onChange: (date: string, hour: string) => void
}

/**
 * 연가 일시 입력(날짜 DatePickerField + 시간 네이티브 select 조합, 작성/수정 폼 공용).
 *
 * datetime-local은 step=3600을 줘도 브라우저 UI에 분 칸이 남아 "1시간 단위만 사용" 규칙이
 * 시각적으로 드러나지 않는다 — 분 개념을 UI에서 아예 제거하기 위해 날짜와 시를 분리
 * 입력받는다. 날짜는 shadcn Calendar 팝오버(DatePickerField, 2026-07-11 도입)로 고른다.
 * 시간 select는 네이티브 select 정본 컨벤션(h-8·px-2.5·text-sm, 근태 DeptAttendancePage 톤)을
 * 따르고, 옵션 라벨은 "09:00" 형태로 정시 단위임을 드러낸다.
 * 조합값(`yyyy-MM-ddTHH:00`)의 zod 필드 동기화는 페이지(onChange)가 소유한다.
 */
export function LeaveDateHourField({
  id,
  label,
  hourAriaLabel,
  dateValue,
  hourValue,
  minDate,
  error,
  disabled = false,
  hourOptions,
  onChange,
}: LeaveDateHourFieldProps) {
  const options = hourOptions ?? HOUR_OPTIONS
  // 현재 값이 제한 옵션 밖이면(수정 폼의 기존 데이터 프리필 등) 값 보존용 옵션을 추가한다.
  const hasOutOfRangeValue = !!hourValue && !options.includes(hourValue)
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        <DatePickerField
          id={id}
          value={dateValue}
          minDate={minDate}
          className="min-w-0 flex-1"
          ariaInvalid={!!error}
          disabled={disabled}
          onChange={(date) => onChange(date, hourValue)}
        />
        <select
          aria-label={hourAriaLabel}
          aria-invalid={!!error}
          disabled={disabled}
          value={hourValue}
          onChange={(event) => onChange(dateValue, event.target.value)}
          className="h-8 w-24 shrink-0 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        >
          <option value="" disabled>
            시간
          </option>
          {hasOutOfRangeValue && (
            <option value={hourValue} disabled>
              {hourValue}:00
            </option>
          )}
          {options.map((hour) => (
            <option key={hour} value={hour}>
              {hour}:00
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
