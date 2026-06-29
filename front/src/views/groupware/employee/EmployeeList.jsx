import {useMemo, useState} from 'react';
import {Badge, Button, Card, Container, Form, InputGroup, Table} from 'react-bootstrap';
import {TbSearch, TbUserPlus} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {EMP_STATUS_META, employees, POSITION_LABEL} from './data';

/**
 * 사원 정보 목록 (EMPS_FOR_MANAGEMENT)
 * 더미 데이터를 클라이언트에서 필터링한다. 실제 연동 시 employeeApi.getEmployeesForManagement 로 교체.
 */
const EmployeeList = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchKeyword =
        !keyword ||
        emp.name.includes(keyword) ||
        emp.email.includes(keyword) ||
        emp.deptName.includes(keyword);
      const matchStatus = !status || emp.status === status;
      return matchKeyword && matchStatus;
    });
  }, [keyword, status]);

  return (
    <Container fluid>
      <PageBreadcrumb title="사원 정보" subtitle="사원" />

      <Card>
        <Card.Header className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div className="d-flex flex-wrap gap-2">
            <InputGroup style={{ width: 260 }}>
              <InputGroup.Text>
                <TbSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="이름·이메일·부서 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </InputGroup>
            <Form.Select
              style={{ width: 160 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(EMP_STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Form.Select>
          </div>
          <Button variant="primary">
            <TbUserPlus className="me-1" /> 사원 등록
          </Button>
        </Card.Header>

        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>사원번호</th>
                <th>이름</th>
                <th>부서</th>
                <th>직급</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>입사일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((emp) => {
                  const meta = EMP_STATUS_META[emp.status];
                  return (
                    <tr key={emp.empId}>
                      <td>{emp.empId}</td>
                      <td className="fw-semibold">{emp.name}</td>
                      <td>{emp.deptName}</td>
                      <td>{POSITION_LABEL[emp.position] ?? emp.position}</td>
                      <td>{emp.email}</td>
                      <td>{emp.phone}</td>
                      <td>{emp.hiredAt ?? '-'}</td>
                      <td>
                        <Badge bg={`${meta.variant}-subtle`} className={`text-${meta.variant}`}>
                          {meta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    조건에 맞는 사원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>

        <Card.Footer className="text-muted">
          총 <strong>{filtered.length}</strong>명
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default EmployeeList;
