import dayjs from 'dayjs'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { ElectronicSignature } from './ElectronicSignature'

/** 결재란 한 칸의 처리 표식(전자서명 또는 상태 동그라미). */
export type PrintApprovalMark =
  | { kind: 'signature'; variant: 'drafter' | 'reviewer'; status: string }
  | { kind: 'stamp'; label: string; tone: 'draft' | 'pending' | 'rejected' }

/** 결재란 세로 열 1개(기안 또는 결재자). 순수 표시 데이터 — 판정은 각 페이지가 끝낸 뒤 주입한다. */
export interface PrintApprovalColumn {
  /** 열 헤더(예: 기안·결재1·협조2). */
  header: string
  /** 담당자 이름. */
  name: string
  /** 서명 또는 상태 동그라미. */
  mark: PrintApprovalMark
  /** 처리 일자(`MM-DD`) 또는 "-". */
  date: string
}

/** 본문 상세 표 한 줄(라벨 + 값). */
export interface PrintDetailField {
  label: string
  value: string
}

export interface DraftPrintDocumentProps {
  /** 문서번호(예: HARUON-2026-12 / "상신 후 자동 부여"). */
  documentNumber: string
  /** 보존연한(고정 표기 "5년"). */
  retentionPeriod: string
  /** 기안일자(`YYYY-MM-DD` 또는 "-"). */
  draftDate: string
  /** 기안부서(데이터 없으면 "-"). */
  draftDept: string
  /** 기안자 이름(좌측 메타 "기안자" 칸). */
  drafterName: string
  /** 문서종류(유형 라벨). */
  documentType: string
  /** 처리기한(데이터 없으면 "-"). */
  processingDeadline: string
  /** 문서 제목. */
  title: string
  /** 결재란 열 목록(첫 열=기안, 이후 결재자 순서대로). */
  approvalColumns: PrintApprovalColumn[]
  /** 기안 본문(줄바꿈 보존). */
  content: string
  /** 유형별 상세 표(없으면 표 생략). */
  detailFields: PrintDetailField[]
  /** 첨부 문서명 목록(없으면 안내 문구). */
  attachments: string[]
  /** 결재완료 시 회사명 우측 상단에 겹칠 마지막 결재자 서명(이름은 aria-label용). 없으면 미표시. */
  companyStamp?: { name: string; status: string } | null
  /** 공람 한 줄 텍스트(서버 문서 전용). 없으면 섹션 생략. */
  circulationText?: string | null
}

// 기안문 표 공통 셀(원본 print.scss `.draft-print-table` th/td: 34px 높이, 1px 진한 테두리, 12px).
const cellBase =
  'h-[34px] border border-neutral-800 px-2 py-1.5 align-middle text-xs text-neutral-900'
// 라벨 th(옅은 회색 배경·중앙·볼드, 폭 76px 고정).
const labelTh = cn(cellBase, 'w-[76px] bg-neutral-100 text-center font-bold')
// 값 td(기본 좌측 정렬).
const valueTd = cellBase
// 결재란 헤더 th(폭 고정 없이 남는 폭을 결재 열 수만큼 균등 분배).
const headerTh = cn(cellBase, 'bg-neutral-100 text-center font-bold')
// "결/재" 세로 헤딩 th(좁은 폭, 줄간격 확보).
const verticalTh = cn(cellBase, 'w-[34px] bg-neutral-100 text-center leading-[1.7] font-bold')
// 결재란 본문 셀(이름 + 서명/도장, 74px 높이).
const approvalCell =
  'relative h-[74px] border border-neutral-800 p-[7px_4px] text-center align-middle text-neutral-900'
// 결재란 처리 일자 셀(작은 회색 글씨).
const dateCell = cn(cellBase, 'text-center text-[10px] text-neutral-500')

/** 결재 표식 렌더: 서명(SVG)이거나 상태 동그라미(원본 `.approval-mark`, 34px 원형 테두리). */
function ApprovalMarkView({ mark, name }: { mark: PrintApprovalMark; name: string }) {
  if (mark.kind === 'signature') {
    return <ElectronicSignature name={name} variant={mark.variant} status={mark.status} />
  }
  return (
    <span
      className={cn(
        'mx-auto mt-[7px] flex size-[34px] items-center justify-center rounded-full border text-[10px]',
        // 반려는 붉은 계열(원본 #b42318), 그 외(작성·예정)는 회색.
        mark.tone === 'rejected'
          ? 'border-[#b42318] text-[#b42318]'
          : 'border-neutral-500 text-neutral-500',
      )}
    >
      {mark.label}
    </span>
  )
}

/**
 * 사기업 "기 안 문" 인쇄 문서(레퍼런스 draft/print/index.tsx + print.scss 이식). 서버 상세와 작성 중
 * 폼 스냅샷 두 진입점이 공용하는 순수 프레젠테이셔널 컴포넌트로, 데이터 판정은 각 페이지가 끝낸 뒤
 * props로 주입한다(로직 없음). 용지 안쪽은 다크모드에서도 흰 종이여야 하므로 시맨틱 토큰이 아닌
 * 고정색(neutral/white)을 쓴다(의도된 예외) — 반면 바깥 배경·툴바는 시맨틱 토큰으로 다크모드에
 * 대응한다. 인쇄 시에는 툴바·바깥 배경·그림자를 print 유틸로 제거한다.
 */
export function DraftPrintDocument({
  documentNumber,
  retentionPeriod,
  draftDate,
  draftDept,
  drafterName,
  documentType,
  processingDeadline,
  title,
  approvalColumns,
  content,
  detailFields,
  attachments,
  companyStamp = null,
  circulationText = null,
}: DraftPrintDocumentProps) {
  const columnCount = approvalColumns.length
  const printedAt = dayjs().format('YYYY-MM-DD')

  return (
    <main className="min-h-screen bg-muted p-0 text-neutral-900 sm:p-6 print:bg-white print:p-0">
      {/* 툴바: 화면 전용(인쇄 시 숨김). 시맨틱 토큰으로 다크모드 대응. */}
      <div className="mx-auto mb-4 flex w-[min(210mm,100%)] items-center justify-between gap-2 rounded-none border bg-card p-3 shadow-sm sm:sticky sm:top-0 sm:z-10 sm:mb-4 sm:rounded-md print:hidden">
        <div className="min-w-0">
          <strong className="block text-sm font-bold text-foreground">인쇄 미리보기</strong>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            A4 세로 · 전자결재 기안문
          </span>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="ghost" onClick={() => window.close()}>
            닫기
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.info('PDF 다운로드 기능은 준비 중입니다')}
          >
            PDF 다운로드
          </Button>
          <Button type="button" onClick={() => window.print()}>
            인쇄
          </Button>
        </div>
      </div>

      {/* A4 용지: 화면은 흰 종이 카드(그림자), 인쇄는 여백 없는 210×297mm 문서. */}
      <article className="mx-auto min-h-[297mm] w-[min(210mm,100%)] bg-white p-[8mm_6mm] shadow-lg sm:p-[14mm_12mm_12mm] print:w-[210mm] print:min-h-[297mm] print:p-[14mm_12mm_12mm] print:shadow-none">
        <h1 className="mb-[10mm] text-center font-serif text-3xl font-bold tracking-[12px]">
          기 안 문
        </h1>

        {/* 기안문 표: 좌측 메타 + 우측 동적 결재란. 결재 열이 많으면 화면에서만 가로 스크롤. */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <tbody>
              <tr>
                <th className={labelTh}>문서번호</th>
                <td className={valueTd} colSpan={3}>
                  {documentNumber}
                </td>
                <th className={verticalTh} rowSpan={4}>
                  결
                  <br />재
                </th>
                {approvalColumns.map((column, index) => (
                  <th key={`approval-header-${index}`} className={headerTh}>
                    {column.header}
                  </th>
                ))}
              </tr>
              <tr>
                <th className={labelTh}>보존연한</th>
                <td className={valueTd} colSpan={3}>
                  {retentionPeriod}
                </td>
                {approvalColumns.map((column, index) => (
                  <td key={`approval-cell-${index}`} className={approvalCell} rowSpan={2}>
                    <span className="block">{column.name}</span>
                    <ApprovalMarkView mark={column.mark} name={column.name} />
                  </td>
                ))}
              </tr>
              <tr>
                <th className={labelTh}>기안일자</th>
                <td className={valueTd} colSpan={3}>
                  {draftDate}
                </td>
              </tr>
              <tr>
                <th className={labelTh}>기안부서</th>
                <td className={valueTd}>{draftDept}</td>
                <th className={labelTh}>기안자</th>
                <td className={valueTd}>{drafterName}</td>
                {approvalColumns.map((column, index) => (
                  <td key={`approval-date-${index}`} className={dateCell}>
                    {column.date}
                  </td>
                ))}
              </tr>
              <tr>
                <th className={labelTh}>문서종류</th>
                <td className={valueTd}>{documentType}</td>
                <th className={labelTh}>처리기한</th>
                {/* 처리기한 값이 결재란 폭 전체를 흡수한다(결재세로 1 + 결재열 columnCount + 기안자값 자리 1). */}
                <td className={valueTd} colSpan={2 + columnCount}>
                  {processingDeadline}
                </td>
              </tr>
              <tr>
                <th className={labelTh}>제목</th>
                <td className={cn(valueTd, 'font-bold')} colSpan={4 + columnCount}>
                  {title}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 본문 영역: 기안 내용 → 상세 표 → 첨부 문서 → 회사명(도장) → 공람. 회사명을 하단으로 민다. */}
        <section className="flex min-h-[180mm] flex-col px-[3mm] pt-[10mm] pb-[6mm] text-[13px] leading-[1.85] text-neutral-900">
          <p className="break-words whitespace-pre-wrap">{content}</p>

          {detailFields.length > 0 && (
            <>
              <h2 className="mt-[8mm] mb-[3mm] text-[14px] font-bold">세부 내역</h2>
              <table className="w-full border-collapse">
                <tbody>
                  {detailFields.map((field) => (
                    <tr key={field.label}>
                      <th className={cn(cellBase, 'w-[110px] bg-neutral-100 text-center font-bold')}>
                        {field.label}
                      </th>
                      <td className={cn(cellBase, 'break-words whitespace-pre-wrap')}>
                        {field.value || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <h2 className="mt-[8mm] mb-[3mm] text-[14px] font-bold">첨부 문서</h2>
          {attachments.length > 0 ? (
            <ol className="list-decimal pl-5">
              {attachments.map((fileName) => (
                <li key={fileName} className="break-words">
                  {fileName}
                </li>
              ))}
            </ol>
          ) : (
            <p>첨부된 문서가 없습니다.</p>
          )}

          {/* 회사명: 본문 하단 중앙. 결재완료면 마지막 결재자 서명을 우측 상단에 도장처럼 겹친다. */}
          <div className="mt-auto pt-[16mm] text-center">
            <span className="relative inline-block text-2xl font-bold tracking-[0.15em]">
              HARUON
              {companyStamp && (
                <span className="absolute -top-3 -right-11">
                  <ElectronicSignature
                    name={companyStamp.name}
                    variant="reviewer"
                    status={companyStamp.status}
                  />
                </span>
              )}
            </span>
          </div>

          {circulationText && (
            <p className="mt-[6mm] text-[11px] text-neutral-500">공람: {circulationText}</p>
          )}
        </section>

        {/* 푸터: 얇은 상단 구분선 + 좌 서비스명 / 우 출력일. */}
        <footer className="flex items-center justify-between border-t border-neutral-400 px-[3mm] pt-[5mm] text-[10px] text-neutral-500">
          <span>HARUON 전자결재</span>
          <span>출력일: {printedAt}</span>
        </footer>
      </article>
    </main>
  )
}
