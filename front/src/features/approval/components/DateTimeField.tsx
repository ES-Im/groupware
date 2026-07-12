import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { DatePickerField } from './DatePickerField'

/**
 * 날짜(`yyyy-MM-dd`)+시각(`HH:mm`) 분리 입력을 zod 필드 값(`yyyy-MM-ddTHH:mm`)으로 조합한다.
 * 한쪽이라도 비면 미완성으로 보고 빈 문자열을 반환한다(스키마의 "입력해주세요" 검증에 위임).
 */
export function composeDateTime(date: string, time: string): string {
  return date && time ? `${date}T${time}` : ''
}

interface DateTimeFieldProps {
  /** 날짜 버튼 id(라벨 htmlFor 연결 대상). */
  id: string
  /** 필드 라벨(예: 출장 시작 일시). */
  label: string
  /** 시각 input 접근 이름(예: 출장 시작 시각 — 날짜 버튼과 별도 컨트롤이라 개별 이름 필요). */
  timeAriaLabel: string
  /** 날짜 값(`yyyy-MM-dd`, 미선택은 빈 문자열). */
  dateValue: string
  /** 시각 값(`HH:mm`, 미선택은 빈 문자열). */
  timeValue: string
  /** 달력 min(과거/역전 차단 — 페이지가 오늘·시작일을 넘긴다). */
  minDate?: string
  /** zod 검증 에러 메시지(페이지의 errors.startAt/endAt 메시지 그대로). */
  error?: string
  /** 날짜·시각 어느 쪽이 바뀌어도 최신 조합을 통째로 알린다(조합·클램프는 페이지 책임). */
  onChange: (date: string, time: string) => void
}

/**
 * 출장 일시 입력(날짜 DatePickerField + 시각 time input 조합, 작성/수정 폼 공용 —
 * 2026-07-11 datetime-local 대체). 출장은 연가와 달리 시간 제약(근무시간·정시)이 없어 시각은
 * 분 단위 네이티브 time input을 유지하고, 불편이 컸던 날짜 선택만 shadcn Calendar 팝오버로
 * 바꾼다. 조합값(`yyyy-MM-ddTHH:mm`)의 zod 필드 동기화는 페이지(onChange)가 소유한다.
 */
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
