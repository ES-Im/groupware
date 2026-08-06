import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { useNewEmployeesQuery } from '@/features/employee/registration/api/useNewEmployeesQuery'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const WIDGET_ITEM_LIMIT = 5

export function NewEmployeeApprovalPreviewWidget() {
  const { data } = useNewEmployeesQuery({ page: 0, size: WIDGET_ITEM_LIMIT })
  const items = data?.content ?? []

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>가입 승인 대기 내역</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            PENDING · 승인 시 재직(ACTIVE) 전환
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary">{data?.totalElements ?? 0}건</Badge>
          <Link
            to="/employees/new"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            전체 사원 관리
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            가입 승인 대기 중인 사원이 없습니다.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    사원번호
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    이름
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    이메일
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.empId}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{item.empNo}</td>
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{item.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{item.email}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <Badge variant="secondary">승인대기</Badge>
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
