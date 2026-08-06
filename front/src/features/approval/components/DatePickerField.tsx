import { useState } from 'react'
import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { ko } from 'react-day-picker/locale'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

interface DatePickerFieldProps {
  id?: string
  value: string
  minDate?: string
  disabled?: boolean
  ariaInvalid?: boolean
  placeholder?: string
  className?: string
  onChange: (date: string) => void
}

export function DatePickerField({
  id,
  value,
  minDate,
  disabled = false,
  ariaInvalid,
  placeholder = '날짜 선택',
  className,
  onChange,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? dayjs(value).toDate() : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'justify-start px-3 text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="text-muted-foreground" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={ko}
          selected={selected}
          defaultMonth={selected}
          disabled={minDate ? { before: dayjs(minDate).toDate() } : undefined}
          onSelect={(date) => {
            onChange(date ? dayjs(date).format('YYYY-MM-DD') : '')
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
