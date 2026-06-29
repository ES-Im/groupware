import {useState} from 'react';
import {Button, Card, Col, Container, Form, Row} from 'react-bootstrap';
import {TbDeviceFloppy, TbSend} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {DRAFT_TYPE_LABEL} from './data';

/**
 * 기안서 작성 (GENERAL / LEAVE / BUSINESS_TRIP 생성)
 * 임시저장 → draftApi.createXxxDraft, 상신 → createAndSubmitXxxDraft 에 연결 예정.
 */
const DraftCreate = () => {
  const [type, setType] = useState('GENERAL');

  return (
    <Container fluid>
      <PageBreadcrumb title="기안서 작성" subtitle="전자결재" />

      <Card>
        <Card.Body>
          <Form>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Label>기안서 종류</Form.Label>
                <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                  {['GENERAL', 'LEAVE', 'BUSINESS_TRIP'].map((key) => (
                    <option key={key} value={key}>
                      {DRAFT_TYPE_LABEL[key]} 기안서
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>제목</Form.Label>
              <Form.Control placeholder="기안서 제목을 입력하세요" />
            </Form.Group>

            {/* 휴가 기안서 전용 필드 */}
            {type === 'LEAVE' && (
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Label>휴가 종류</Form.Label>
                  <Form.Select>
                    <option>연차</option>
                    <option>반차</option>
                    <option>병가</option>
                    <option>특별휴가</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>시작일</Form.Label>
                  <Form.Control type="date" />
                </Col>
                <Col md={4}>
                  <Form.Label>종료일</Form.Label>
                  <Form.Control type="date" />
                </Col>
              </Row>
            )}

            {/* 출장 기안서 전용 필드 */}
            {type === 'BUSINESS_TRIP' && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Label>출장지</Form.Label>
                  <Form.Control placeholder="예: 부산 가맹점" />
                </Col>
                <Col md={3}>
                  <Form.Label>시작일</Form.Label>
                  <Form.Control type="date" />
                </Col>
                <Col md={3}>
                  <Form.Label>종료일</Form.Label>
                  <Form.Control type="date" />
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>내용</Form.Label>
              <Form.Control as="textarea" rows={8} placeholder="기안 내용을 입력하세요" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>결재선</Form.Label>
              <Form.Control placeholder="결재자를 선택하세요 (예: 박서준 이사 → 김하루 매니저)" />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="light">
                <TbDeviceFloppy className="me-1" /> 임시저장
              </Button>
              <Button variant="primary">
                <TbSend className="me-1" /> 상신
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DraftCreate;
