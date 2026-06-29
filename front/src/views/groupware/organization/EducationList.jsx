import {Badge, Button, Card, Col, Container, ProgressBar, Row} from 'react-bootstrap';
import {TbCalendarEvent, TbPlus} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {educations} from './data';

/**
 * 가맹점 교육 목록 (FRANCHISE_EDUCATION_LIST / *_CALENDAR)
 */
const EducationList = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="교육" subtitle="가맹점" />

      <div className="d-flex justify-content-end mb-2">
        <Button variant="primary" size="sm">
          <TbPlus className="me-1" /> 교육 등록
        </Button>
      </div>

      <Row className="row-cols-xxl-2 row-cols-1 g-3">
        {educations.map((edu) => {
          const ratio = edu.capacity ? Math.round((edu.applicants / edu.capacity) * 100) : 0;
          const full = edu.applicants >= edu.capacity;
          return (
            <Col key={edu.educationId}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="mb-0">{edu.title}</h5>
                    {edu.active ? (
                      <Badge bg="success-subtle" className="text-success">
                        모집중
                      </Badge>
                    ) : (
                      <Badge bg="secondary-subtle" className="text-secondary">
                        마감
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted mb-3">
                    <TbCalendarEvent className="me-1" />
                    {edu.date}
                  </p>
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">신청 현황</small>
                    <small className="fw-semibold">
                      {edu.applicants} / {edu.capacity}명
                    </small>
                  </div>
                  <ProgressBar
                    now={ratio}
                    variant={full ? 'danger' : 'primary'}
                    style={{ height: 6 }}
                  />
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default EducationList;
