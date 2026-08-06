import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useManagementReservationsQuery } from '@/features/meeting/api/useManagementReservationsQuery'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const TODAY = dayjs().format('YYYY-MM-DD')
const CURRENT_YEAR_MONTH = dayjs().format('YYYY-MM')

export function MeetingRoomStatusWidget() {
  const { data } = useManagementReservationsQuery({
    yearMonth: CURRENT_YEAR_MONTH,
    page: 0,
    size: 100,
  })
  const todayItems = (data?.content ?? [])
    .filter((item) => item.meetingDate === TODAY)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>회의실 예약 현황</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">오늘 예약된 회의</p>
        </div>
        <Link
          to="/meetings/management"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          예약 관리
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {todayItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">오늘 예약된 회의가 없습니다.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    회의실
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    시간
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    주최
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    참석
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {todayItems.map((item) => (
                  <tr
                    key={item.meetingId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{item.meetingRoomName}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {dayjs(item.startAt, 'HH:mm:ss').format('HH:mm')} –{' '}
                      {dayjs(item.endAt, 'HH:mm:ss').format('HH:mm')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {item.reserverEmpName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {item.participantCount}명
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <Badge variant={item.isCanceled ? 'destructive' : 'default'}>
                        {item.isCanceled ? '취소' : '확정'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
