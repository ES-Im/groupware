import {useState} from 'react';
import {Badge, Button, Card, Col, Container, Form, Row, Table} from 'react-bootstrap';
import {TbClockPause, TbClockPlay} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {ATTENDANCE_STATUS_META, myAttendances, myAttendanceSummary} from './data';

/**
 * 내 월별 근태 (MY_ATTENDANCE_MONTHLY / *_SUMMARY)
 * 출근/퇴근 기록 버튼은 employeeApi.checkIn / checkOut 에 연결 예정.
 */
const SummaryCard = ({ label, value, variant }) => (
  <Card className="text-center">
    <Card.Body className="py-3">
      <h3 className={`text-${variant} mb-1`}>{value}</h3>
      <p className="text-muted mb-0">{label}</p>
    </Card.Body>
  </Card>
);

const AttendanceList = () => {
  const [yearMonth, setYearMonth] = useState(myAttendanceSummary.yearMonth);

  return (
    <Container fluid>
      <PageBreadcrumb title="내 근태" subtitle="사원" />

      <Row className="mb-2">
        <Col className="d-flex gap-2 justify-content-end">
          <Button variant="success">
            <TbClockPlay className="me-1" /> 출근 기록
          </Button>
          <Button variant="outline-success">
            <TbClockPause className="me-1" /> 퇴근 기록
          </Button>
        </Col>
      </Row>

      <Row className="row-cols-xxl-5 row-cols-md-3 row-cols-2 g-2 mb-3">
        <Col>
          <SummaryCard label="정상근무" value={`${myAttendanceSummary.normalDays}일`} variant="success" />
        </Col>
        <Col>
          <SummaryCard label="연차" value={`${myAttendanceSummary.annualLeaveDays}일`} variant="primary" />
        </Col>
        <Col>
          <SummaryCard label="반차" value={`${myAttendanceSummary.halfDays}일`} variant="info" />
        </Col>
        <Col>
          <SummaryCard label="지각/조퇴" value={`${myAttendanceSummary.lateCount}회`} variant="secondary" />
        </Col>
        <Col>
          <SummaryCard label="결근" value={`${myAttendanceSummary.absenceDays}일`} variant="danger" />
        </Col>
      </Row>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">근태 내역</h5>
          <Form.Control
            type="month"
            style={{ width: 180 }}
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>날짜</th>
                <th>출근</th>
                <th>퇴근</th>
                <th>상태</th>
                <th>승인</th>
              </tr>
            </thead>
            <tbody>
              {myAttendances.map((row) => {
                const meta = ATTENDANCE_STATUS_META[row.status];
                return (
                  <tr key={row.attendanceId}>
                    <td className="fw-semibold">{row.date}</td>
                    <td>{row.checkInAt ?? '-'}</td>
                    <td>{row.checkOutAt ?? '-'}</td>
                    <td>
                      <Badge bg={`${meta.variant}-subtle`} className={`text-${meta.variant}`}>
                        {meta.label}
                      </Badge>
                    </td>
                    <td>
                      {row.approved ? (
                        <Badge bg="success-subtle" className="text-success">
                          승인
                        </Badge>
                      ) : (
                        <Badge bg="warning-subtle" className="text-warning">
                          대기
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AttendanceList;
