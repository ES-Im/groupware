import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

export function formatOvertimeMinutes(minutes: number): string {
  if (minutes === 0) {
    return '0분'
  }

  const dur = dayjs.duration(minutes, 'minutes')
  const hours = Math.floor(dur.asHours())
  const mins = dur.minutes()

  if (hours === 0) {
    return `${mins}분`
  }

  return `${hours}시간 ${mins}분`
}
