import { useState } from 'react'
import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { ko } from 'react-day-picker/locale'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

interface DatePickerFieldProps {
  /** 트리거 버튼 id(라벨 htmlFor 연결 대상 — 버튼도 labelable 요소다). */
  id?: string
  /** 날짜 값(`yyyy-MM-dd`, 미선택은 빈 문자열). */
  value: string
  /** 이 날짜 이전을 달력에서 비활성화(과거/역전 차단 — 페이지가 오늘·시작일을 넘긴다). */
  minDate?: string
  /** 표시 전용 모드(자동 계산 파생값 등 — 값은 보여주되 열지 못하게). */
  disabled?: boolean
  /** zod 검증 에러와 연동한 시각 표시(aria-invalid). */
  ariaInvalid?: boolean
  /** 미선택일 때 버튼에 보여줄 문구. */
  placeholder?: string
  className?: string
  /** 달력에서 날짜를 고르면 `yyyy-MM-dd`로 알린다(빈 문자열 = 해제). */
  onChange: (date: string) => void
}

/**
 * shadcn Calendar(react-day-picker) 팝오버 날짜 선택 버튼(2026-07-11 사용자 승인 도입 —
 * 네이티브 date input의 불편한 브라우저 기본 UI 대체). 값 문자열 계약(`yyyy-MM-dd`)은 기존
 * date input과 동일해 소비처(LeaveDateHourField·출장 폼)의 조합/동기화 로직을 바꾸지 않는다.
 */
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
