import {useState} from 'react';
import {Badge, Button, Card, Col, Container, Form, InputGroup, Row} from 'react-bootstrap';
import {TbBookmark, TbBookmarkFilled, TbSend} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {chatMessages, chatRooms} from './data';

/**
 * 채팅 (CHAT_ROOM_LIST + CHAT_MESSAGES)
 * 실시간 송수신은 STOMP(WebSocket)로 처리 예정 — 여기서는 더미 UI만 구성.
 */
const Chat = () => {
  const [activeRoomId, setActiveRoomId] = useState(chatRooms[0].roomId);
  const activeRoom = chatRooms.find((r) => r.roomId === activeRoomId);

  return (
    <Container fluid>
      <PageBreadcrumb title="채팅" subtitle="커뮤니케이션" />

      <Row className="g-2">
        {/* 채팅방 목록 */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">채팅방</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {chatRooms.map((room) => (
                <button
                  type="button"
                  key={room.roomId}
                  onClick={() => setActiveRoomId(room.roomId)}
                  className={`d-flex w-100 border-0 text-start align-items-center gap-2 p-3 border-bottom ${
                    room.roomId === activeRoomId ? 'bg-light bg-opacity-50' : 'bg-transparent'
                  }`}
                >
                  <div className="avatar-sm">
                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle">
                      {room.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold text-truncate">
                        {room.bookmark && <TbBookmarkFilled className="text-warning me-1" />}
                        {room.name}
                      </span>
                      <small className="text-muted">{room.lastMessageAt}</small>
                    </div>
                    <small className="text-muted text-truncate d-block">{room.lastMessage}</small>
                  </div>
                  {room.unread > 0 && (
                    <Badge bg="danger" pill>
                      {room.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* 메시지 영역 */}
        <Col lg={8}>
          <Card className="h-100 d-flex flex-column">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{activeRoom?.name}</h5>
              <Button variant="link" className="text-warning p-0">
                {activeRoom?.bookmark ? <TbBookmarkFilled /> : <TbBookmark />}
              </Button>
            </Card.Header>
            <Card.Body className="flex-grow-1" style={{ minHeight: 360 }}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`d-flex mb-3 ${msg.mine ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div style={{ maxWidth: '70%' }}>
                    {!msg.mine && <small className="text-muted d-block mb-1">{msg.senderName}</small>}
                    <div
                      className={`p-2 px-3 rounded ${
                        msg.mine ? 'bg-primary text-white' : 'bg-light'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <small className="text-muted">{msg.sentAt}</small>
                  </div>
                </div>
              ))}
            </Card.Body>
            <Card.Footer>
              <InputGroup>
                <Form.Control placeholder="메시지를 입력하세요" />
                <Button variant="primary">
                  <TbSend />
                </Button>
              </InputGroup>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Chat;
