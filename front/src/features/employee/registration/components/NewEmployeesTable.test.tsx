import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { NewEmpRecord } from '../model/newEmployee'
import { NewEmployeesTable } from './NewEmployeesTable'

/**
 * NewEmployeesTable(T1.5, F001) 검증.
 * 네트워크 없는 순수 렌더 컴포넌트라 QueryClientProvider/MSW 없이 data prop만으로 검증한다.
 */
const records: NewEmpRecord[] = [
  { empId: 1, empNo: 'E100', name: '홍길동', loginId: 'hong123', email: 'hong@haruon.com', extensionNo: '1234' },
  { empId: 2, empNo: 'E101', name: '김철수', loginId: 'kim456', email: 'kim@haruon.com', extensionNo: '5678' },
]

describe('NewEmployeesTable', () => {
  it('5개 컬럼 헤더와 각 행의 데이터를 렌더한다', () => {
    render(<NewEmployeesTable data={records} onApprove={vi.fn()} />)

    for (const header of ['사원번호', '이름', '로그인ID', '이메일', '내선번호']) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }
    expect(screen.getByText('E100')).toBeInTheDocument()
    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('hong123')).toBeInTheDocument()
    expect(screen.getByText('hong@haruon.com')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '승인' })).toHaveLength(2)
  })

  it('[승인] 클릭 시 해당 행의 empId·name·loginId로 onApprove를 호출한다', async () => {
    const onApprove = vi.fn()
    const user = userEvent.setup()
    render(<NewEmployeesTable data={records} onApprove={onApprove} />)

    const approveButtons = screen.getAllByRole('button', { name: '승인' })
    await user.click(approveButtons[1])

    expect(onApprove).toHaveBeenCalledTimes(1)
    expect(onApprove).toHaveBeenCalledWith(2, '김철수', 'kim456')
  })
})
