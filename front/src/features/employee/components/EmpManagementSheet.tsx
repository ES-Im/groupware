import type { ComponentType, ReactNode, SVGProps } from 'react'
import { useState } from 'react'
import dayjs from 'dayjs'
import { Activity, IdCard, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { EmpBelongingTransferDialog } from './EmpBelongingTransferDialog'
import { EmpStatusActionButtons } from './EmpStatusActionButtons'
import { HrManagedInfoDialog } from './HrManagedInfoDialog'
import type { EmpManagementRecord } from '../model/empManagement'
import {
  empStatusBadgeVariant,
  empStatusLabels,
  systemRoleBadgeVariant,
  systemRoleLabels,
} from '../model/empManagement'

interface EmpManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: EmpManagementRecord | undefined
}

/** 아이콘 + muted 소제목의 섹션 헤딩(EmployeeSummaryCard 패턴 재사용). */
function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </h3>
  )
}

/** 라벨 + 값 한 칸(라운드 보더 박스). EmpManagementSection의 정보 박스 패턴과 동일. */
function InfoCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium break-words text-foreground">{value}</p>
    </div>
  )
}

/**
 * 사원관리 목록(EmpManagementListPage)의 우측 오버레이 시트(전사 사원 조회+관리, HR/ADMIN 전용).
 *
 * record는 호출부가 목록 쿼리 캐시에서 empId로 파생해 전달한 최신 값이다(스냅샷을 이 컴포넌트가
 * 별도로 들고 있지 않음) — 상태 전환·부서 전보·정보 수정 mutation이 성공하면 각 훅이 이미
 * empsForManagement 캐시를 invalidate하므로, 목록이 재조회되는 즉시 이 prop도 함께 갱신되어
 * 시트가 자체적으로 최신 상태를 반영한다.
 *
 * 폭 50% 오버라이드는 SheetContent 기본값(`data-[side=right]:w-3/4`,
 * `data-[side=right]:sm:max-w-sm`)과 같은 `data-[side=right]:` variant를 붙여야 tailwind-merge가
 * 충돌을 인식해 덮어쓴다(EmployeeSearchOverlay 선례 — 속성 셀렉터라 특이도가 높아 variant가
 * 다르면 우선순위가 뒤섞인다).
 */
export function EmpManagementSheet({ open, onOpenChange, record }: EmpManagementSheetProps) {
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const currentPrimary = record?.belongings.find((b) => b.isPrimary && b.endAt === null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:w-1/2 data-[side=right]:sm:max-w-none">
        <SheetHeader>
          <SheetTitle>사원 관리</SheetTitle>
        </SheetHeader>

        {!record ? (
          <p className="px-4 text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
            {/* 신원 요약 헤더: 이름·사번 + 현재 근무 상태 배지 */}
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {record.empName}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">사번 {record.empNo}</p>
              </div>
              <Badge variant={empStatusBadgeVariant[record.status]} className="shrink-0">
                {empStatusLabels[record.status]}
              </Badge>
            </div>

            <section className="space-y-2.5">
              <SectionHeading icon={IdCard}>기본 정보</SectionHeading>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCell label="이메일" value={record.email} />
                <InfoCell label="현재 부서" value={currentPrimary?.deptName ?? '소속 없음'} />
              </div>
            </section>

            <section className="space-y-2.5">
              <SectionHeading icon={ShieldCheck}>시스템 권한</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {record.systemRoleCodeName.map((code) => (
                  <Badge key={code} variant={systemRoleBadgeVariant[code]}>
                    {systemRoleLabels[code]}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="space-y-2.5 border-t pt-5">
              <SectionHeading icon={SlidersHorizontal}>관리 작업</SectionHeading>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setInfoDialogOpen(true)}>
                  정보/역할 수정
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!currentPrimary}
                  onClick={() => setTransferDialogOpen(true)}
                >
                  부서 이동
                </Button>
              </div>
            </section>

            <section className="space-y-2.5">
              <SectionHeading icon={Activity}>근무 상태 변경</SectionHeading>
              <EmpStatusActionButtons empId={record.empId} status={record.status} />
            </section>

            <HrManagedInfoDialog
              open={infoDialogOpen}
              onOpenChange={setInfoDialogOpen}
              empId={record.empId}
              record={record}
            />

            {currentPrimary && (
              <EmpBelongingTransferDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                empId={record.empId}
                currentPrimaryStartAt={currentPrimary.startAt}
                defaultStartAt={dayjs().format('YYYY-MM-DD')}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
