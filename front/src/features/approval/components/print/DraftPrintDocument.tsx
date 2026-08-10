import dayjs from 'dayjs'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { ElectronicSignature } from './ElectronicSignature'

export type PrintApprovalMark =
  | { kind: 'signature'; variant: 'drafter' | 'reviewer'; status: string }
  | { kind: 'stamp'; label: string; tone: 'draft' | 'pending' | 'rejected' }

export interface PrintApprovalColumn {
  header: string
  name: string
  mark: PrintApprovalMark
  date: string
}

export interface PrintDetailField {
  label: string
  value: string
}

export interface DraftPrintDocumentProps {
  documentNumber: string
  retentionPeriod: string
  draftDate: string
  draftDept: string
  drafterName: string
  documentType: string
  processingDeadline: string
  title: string
  approvalColumns: PrintApprovalColumn[]
  content: string
  detailFields: PrintDetailField[]
  attachments: string[]
  companyStamp?: { name: string; status: string } | null
  circulationText?: string | null
}

const cellBase =
  'h-[34px] border border-neutral-800 px-2 py-1.5 align-middle text-xs text-neutral-900'
const labelTh = cn(cellBase, 'w-[76px] bg-neutral-100 text-center font-bold')
const valueTd = cellBase
const headerTh = cn(cellBase, 'bg-neutral-100 text-center font-bold')
const verticalTh = cn(cellBase, 'w-[34px] bg-neutral-100 text-center leading-[1.7] font-bold')
const approvalCell =
  'relative h-[74px] border border-neutral-800 p-[7px_4px] text-center align-middle text-neutral-900'
const dateCell = cn(cellBase, 'text-center text-[10px] text-neutral-500')

function ApprovalMarkView({ mark, name }: { mark: PrintApprovalMark; name: string }) {
  if (mark.kind === 'signature') {
    return <ElectronicSignature name={name} variant={mark.variant} status={mark.status} />
  }
  return (
    <span
      className={cn(
        'mx-auto mt-[7px] flex size-[34px] items-center justify-center rounded-full border text-[10px]',
        mark.tone === 'rejected'
          ? 'border-[#b42318] text-[#b42318]'
          : 'border-neutral-500 text-neutral-500',
      )}
    >
      {mark.label}
    </span>
  )
}

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
          <Button type="button" onClick={() => window.print()}>
            인쇄
          </Button>
        </div>
      </div>

      <article className="mx-auto min-h-[297mm] w-[min(210mm,100%)] bg-white p-[8mm_6mm] shadow-lg sm:p-[14mm_12mm_12mm] print:w-[210mm] print:min-h-[297mm] print:p-[14mm_12mm_12mm] print:shadow-none">
        <h1 className="mb-[10mm] text-center font-serif text-3xl font-bold tracking-[12px]">
          기 안 문
        </h1>

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

        <footer className="flex items-center justify-between border-t border-neutral-400 px-[3mm] pt-[5mm] text-[10px] text-neutral-500">
          <span>HARUON 전자결재</span>
          <span>출력일: {printedAt}</span>
        </footer>
      </article>
    </main>
  )
}
