import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { DatePickerField } from './DatePickerField'

export function composeDateTime(date: string, time: string): string {
  return date && time ? `${date}T${time}` : ''
}

interface DateTimeFieldProps {
  id: string
  label: string
  timeAriaLabel: string
  dateValue: string
  timeValue: string
  minDate?: string
  error?: string
  onChange: (date: string, time: string) => void
}

export function DateTimeField({
  id,
  label,
  timeAriaLabel,
  dateValue,
  timeValue,
  minDate,
  error,
  onChange,
}: DateTimeFieldProps) {
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
          onChange={(date) => onChange(date, timeValue)}
        />
        <Input
          type="time"
          aria-label={timeAriaLabel}
          aria-invalid={!!error}
          className="w-28 shrink-0"
          value={timeValue}
          onChange={(event) => onChange(dateValue, event.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
