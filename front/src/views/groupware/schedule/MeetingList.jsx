import {Badge, Button, Card, Container, Table} from 'react-bootstrap';
import {TbCalendarPlus, TbUsers} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {MEETING_STATUS_META, meetings} from './data';

/**
 * 회의 예약 목록 (MY_MEETING_RESERVATIONS / MEETING_RESERVATION_MANAGEMENT)
 */
const MeetingList = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="회의 예약" subtitle="일정/회의" />

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">회의 예약</h5>
          <Button variant="primary" size="sm">
            <TbCalendarPlus className="me-1" /> 회의 예약
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>제목</th>
                <th>회의실</th>
                <th>시작</th>
                <th>종료</th>
                <th>참여자</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => {
                const meta = MEETING_STATUS_META[m.status];
                return (
                  <tr key={m.meetingId}>
                    <td className="fw-semibold">{m.title}</td>
                    <td>{m.roomName}</td>
                    <td>{m.startAt}</td>
                    <td>{m.endAt}</td>
                    <td>
                      <TbUsers className="me-1 text-muted" />
                      {m.participants}명
                    </td>
                    <td>
                      <Badge bg={`${meta.variant}-subtle`} className={`text-${meta.variant}`}>
                        {meta.label}
                      </Badge>
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

export default MeetingList;
