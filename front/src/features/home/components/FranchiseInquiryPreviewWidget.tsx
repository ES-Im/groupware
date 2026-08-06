import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useFranchiseInquiriesQuery } from '@/features/franchise/api/useFranchiseInquiriesQuery'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const WIDGET_ITEM_LIMIT = 4

export function FranchiseInquiryPreviewWidget() {
  const { data } = useFranchiseInquiriesQuery({ isAnswered: false, page: 0, size: WIDGET_ITEM_LIMIT })
  const items = data?.content ?? []

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>가맹점 문의 내역</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            미답변 {data?.totalElements ?? 0}건 · 답변 담당 배정
          </p>
        </div>
        <Link
          to="/franchise-inquiries"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          문의 관리
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">미답변 문의가 없습니다.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    가맹점
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    문의
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    담당자
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                    접수
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.inquiryId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{item.franchiseName}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{item.inquiryTitle}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {item.assignedManagerName ? (
                        item.assignedManagerName
                      ) : (
                        <Badge variant="outline">미배정</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-muted-foreground">
                      {dayjs(item.inquiryAt).format('MM-DD')}
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
