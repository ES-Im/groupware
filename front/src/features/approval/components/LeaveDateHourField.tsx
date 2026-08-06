import { Label } from '@/shared/ui/label'
import { LEAVE_DAY_END_HOUR, LEAVE_DAY_START_HOUR } from '../lib/leaveHours'
import { DatePickerField } from './DatePickerField'

const HOUR_OPTIONS = Array.from(
  { length: LEAVE_DAY_END_HOUR - LEAVE_DAY_START_HOUR + 1 },
  (_, index) => String(LEAVE_DAY_START_HOUR + index).padStart(2, '0'),
)

export function composeLeaveAt(date: string, hour: string): string {
  return date && hour ? `${date}T${hour}:00` : ''
}

interface LeaveDateHourFieldProps {
  id: string
  label: string
  hourAriaLabel: string
  dateValue: string
  hourValue: string
  minDate?: string
  error?: string
  disabled?: boolean
  hourOptions?: readonly string[]
  onChange: (date: string, hour: string) => void
}

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
