import {Badge, Button, Card, Col, Container, Row} from 'react-bootstrap';
import {TbDoor, TbMapPin, TbPlus, TbUsers} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {meetingRooms} from './data';

/**
 * 회의실 목록 (MEETING_ROOM_MANAGEMENT / AVAILABLE_MEETING_ROOMS)
 */
const MeetingRoomList = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="회의실" subtitle="일정/회의" />

      <div className="d-flex justify-content-end mb-2">
        <Button variant="primary" size="sm">
          <TbPlus className="me-1" /> 회의실 등록
        </Button>
      </div>

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1 g-3">
        {meetingRooms.map((room) => (
          <Col key={room.meetingRoomId}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="avatar-sm">
                    <span className="avatar-title bg-primary-subtle text-primary rounded fs-22">
                      <TbDoor />
                    </span>
                  </div>
                  {room.active ? (
                    <Badge bg="success-subtle" className="text-success">
                      사용 가능
                    </Badge>
                  ) : (
                    <Badge bg="secondary-subtle" className="text-secondary">
                      비활성
                    </Badge>
                  )}
                </div>
                <h5 className="mb-1">{room.name}</h5>
                <p className="text-muted mb-2 fs-sm">
                  <TbMapPin className="me-1" />
                  {room.location}
                </p>
                <div className="d-flex justify-content-between text-muted fs-sm">
                  <span>
                    <TbUsers className="me-1" />
                    {room.capacity}명
                  </span>
                  <span>{room.equipment}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default MeetingRoomList;
