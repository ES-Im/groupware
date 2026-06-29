import {Badge, Button, Card, Col, Container, Row} from 'react-bootstrap';
import {TbMail, TbPencil, TbPhone} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {EMP_STATUS_META, myInfo, POSITION_LABEL} from './data';

/**
 * 내 정보 (RETRIEVE_ME_INFO)
 * 실제 연동 시 employeeApi.getMe / updateMe 로 교체.
 */
const InfoRow = ({ label, value }) => (
  <Row className="py-2 border-bottom">
    <Col xs={4} className="text-muted">
      {label}
    </Col>
    <Col xs={8} className="fw-medium">
      {value ?? '-'}
    </Col>
  </Row>
);

const MyInfo = () => {
  const meta = EMP_STATUS_META[myInfo.status];

  return (
    <Container fluid>
      <PageBreadcrumb title="내 정보" subtitle="사원" />

      <Row>
        <Col lg={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="avatar-xl mx-auto mb-3">
                <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-24">
                  {myInfo.name.charAt(0)}
                </span>
              </div>
              <h4 className="mb-1">{myInfo.name}</h4>
              <p className="text-muted mb-2">
                {myInfo.deptName} · {POSITION_LABEL[myInfo.position]}
              </p>
              <Badge bg={`${meta.variant}-subtle`} className={`text-${meta.variant} mb-3`}>
                {meta.label}
              </Badge>
              <div className="d-flex flex-column gap-1 text-start mt-3">
                <span className="text-muted">
                  <TbMail className="me-2" />
                  {myInfo.email}
                </span>
                <span className="text-muted">
                  <TbPhone className="me-2" />
                  {myInfo.phone}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">상세 정보</h5>
              <Button variant="soft-primary" size="sm">
                <TbPencil className="me-1" /> 정보 수정
              </Button>
            </Card.Header>
            <Card.Body>
              <InfoRow label="사원번호" value={myInfo.empId} />
              <InfoRow label="시스템 권한" value={myInfo.systemRole} />
              <InfoRow label="생년월일" value={myInfo.birthDate} />
              <InfoRow label="입사일" value={myInfo.hiredAt} />
              <InfoRow label="주소" value={myInfo.address} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MyInfo;
