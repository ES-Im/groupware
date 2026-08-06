import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useFranchiseEducationCalendarQuery } from '@/features/franchise/api/useFranchiseEducationCalendarQuery'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const WIDGET_ITEM_LIMIT = 4

export function FranchiseEducationPreviewWidget() {
  const { data } = useFranchiseEducationCalendarQuery()
  const items = [...(data ?? [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, WIDGET_ITEM_LIMIT)

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>가맹점 교육 신청 내역</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">신청 접수 · 진행 예정</p>
        </div>
        <Link
          to="/franchise-educations"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          교육 관리
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">등록된 교육이 없습니다.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    교육명
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    일정
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    장소
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{item.title}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {dayjs(item.date).format('MM-DD')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{item.place}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {item.isFull ? (
                        <Badge variant="secondary">마감</Badge>
                      ) : item.isActive ? (
                        <Badge variant="default">접수중</Badge>
                      ) : (
                        <Badge variant="outline">비활성</Badge>
                      )}
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
