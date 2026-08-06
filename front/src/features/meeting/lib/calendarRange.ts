import dayjs from 'dayjs'

export type CalendarRangeParams = {
  start?: string
  end?: string
}

export function buildCalendarRangeParams(activeStart?: Date, activeEnd?: Date): CalendarRangeParams {
  return {
    start: activeStart ? dayjs(activeStart).format('YYYY-MM-DDTHH:mm:ss') : undefined,
    end: activeEnd ? dayjs(activeEnd).format('YYYY-MM-DDTHH:mm:ss') : undefined,
  }
}
