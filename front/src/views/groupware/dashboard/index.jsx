import {Badge, Card, Col, Container, Row, Table} from 'react-bootstrap';
import CountUp from 'react-countup';
import {TbCalendarEvent, TbFileText, TbMail, TbUsers} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {pendingApprovalDrafts} from '@/views/groupware/draft/data';
import {MEETING_STATUS_META, meetings} from '@/views/groupware/schedule/data';

/**
 * HARUON 메인 대시보드
 * 여러 도메인의 요약 정보를 더미로 모아 보여준다.
 */
const stats = [
  { title: '결재 대기', value: 5, icon: TbFileText, variant: 'warning', suffix: '건' },
  { title: '읽지 않은 쪽지', value: 1, icon: TbMail, variant: 'primary', suffix: '건' },
  { title: '오늘 회의', value: 2, icon: TbCalendarEvent, variant: 'info', suffix: '건' },
  { title: '재직 사원', value: 48, icon: TbUsers, variant: 'success', suffix: '명' },
];

const Dashboard = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="대시보드" subtitle="HARUON" />

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1 g-3 mb-2">
        {stats.map((s) => (
          <Col key={s.title}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="avatar fs-60 flex-shrink-0">
                    <span
                      className={`avatar-title bg-${s.variant}-subtle text-${s.variant} rounded-circle fs-24`}
                    >
                      <s.icon />
                    </span>
                  </div>
                  <div className="text-end">
                    <h3 className="mb-1 fw-normal">
                      <CountUp end={s.value} suffix={s.suffix} />
                    </h3>
                    <p className="mb-0 text-muted">{s.title}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col xxl={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">결재 대기 문서</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="table-custom table-centered mb-0">
                <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
                  <tr>
                    <th>제목</th>
                    <th>기안자</th>
                    <th>작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovalDrafts.map((d) => (
                    <tr key={d.draftId}>
                      <td className="fw-semibold">{d.title}</td>
                      <td>{d.drafterName}</td>
                      <td className="text-muted">{d.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col xxl={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">오늘의 회의</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="table-custom table-centered mb-0">
                <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
                  <tr>
                    <th>제목</th>
                    <th>회의실</th>
                    <th>시간</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.slice(0, 3).map((m) => {
                    const meta = MEETING_STATUS_META[m.status];
                    return (
                      <tr key={m.meetingId}>
                        <td className="fw-semibold">{m.title}</td>
                        <td>{m.roomName}</td>
                        <td className="text-muted">{m.startAt.slice(11)}</td>
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
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
