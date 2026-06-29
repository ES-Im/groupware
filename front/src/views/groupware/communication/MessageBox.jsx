import {useState} from 'react';
import {Badge, Button, Card, Container, Nav, Table} from 'react-bootstrap';
import {TbCircleFilled, TbMailPlus} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {receivedMessages, sentMessages} from './data';

/**
 * 쪽지함 (받은/보낸) — RECEIVED/SENT MESSAGE API
 */
const ReceivedTable = () => (
  <Table responsive hover className="table-custom table-centered mb-0">
    <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
      <tr>
        <th style={{ width: 40 }}></th>
        <th>발신자</th>
        <th>제목</th>
        <th>받은 시각</th>
      </tr>
    </thead>
    <tbody>
      {receivedMessages.map((m) => (
        <tr key={m.messageId} className={m.read ? '' : 'fw-semibold'}>
          <td>{!m.read && <TbCircleFilled className="text-primary fs-xs" />}</td>
          <td>{m.senderName}</td>
          <td>{m.title}</td>
          <td className="text-muted">{m.sentAt}</td>
        </tr>
      ))}
    </tbody>
  </Table>
);

const SentTable = () => (
  <Table responsive hover className="table-custom table-centered mb-0">
    <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
      <tr>
        <th>수신자</th>
        <th>제목</th>
        <th>보낸 시각</th>
      </tr>
    </thead>
    <tbody>
      {sentMessages.map((m) => (
        <tr key={m.messageId}>
          <td>{m.receiverName}</td>
          <td className="fw-semibold">{m.title}</td>
          <td className="text-muted">{m.sentAt}</td>
        </tr>
      ))}
    </tbody>
  </Table>
);

const MessageBox = () => {
  const [tab, setTab] = useState('received');
  const unreadCount = receivedMessages.filter((m) => !m.read).length;

  return (
    <Container fluid>
      <PageBreadcrumb title="쪽지" subtitle="커뮤니케이션" />

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Nav variant="tabs" className="card-header-tabs" activeKey={tab} onSelect={setTab}>
            <Nav.Item>
              <Nav.Link eventKey="received">
                받은 쪽지
                {unreadCount > 0 && (
                  <Badge bg="primary" className="ms-1">
                    {unreadCount}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="sent">보낸 쪽지</Nav.Link>
            </Nav.Item>
          </Nav>
          <Button variant="primary" size="sm">
            <TbMailPlus className="me-1" /> 쪽지 쓰기
          </Button>
        </Card.Header>
        <Card.Body className="p-0">{tab === 'received' ? <ReceivedTable /> : <SentTable />}</Card.Body>
      </Card>
    </Container>
  );
};

export default MessageBox;
