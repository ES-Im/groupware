import {useState} from 'react';
import {Badge, Card, Col, Container, Nav, Row, Table} from 'react-bootstrap';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {APPROVAL_STATUS_META, documentBoxSummary, DRAFT_TYPE_LABEL, submittedDrafts, unsubmittedDrafts,} from './data';

/**
 * 문서함 (MY_SUBMITTED_DRAFTS / MY_UNSUBMITTED_DRAFTS / MY_DOCUMENT_BOX_SUMMARY)
 */
const SummaryCard = ({ label, value, variant }) => (
  <Card className="text-center">
    <Card.Body className="py-3">
      <h3 className={`text-${variant} mb-1`}>{value}</h3>
      <p className="text-muted mb-0">{label}</p>
    </Card.Body>
  </Card>
);

const DraftTable = ({ rows }) => (
  <Table responsive hover className="table-custom table-centered mb-0">
    <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
      <tr>
        <th>번호</th>
        <th>종류</th>
        <th>제목</th>
        <th>기안자</th>
        <th>상태</th>
        <th>작성일</th>
      </tr>
    </thead>
    <tbody>
      {rows.length ? (
        rows.map((row) => {
          const meta = APPROVAL_STATUS_META[row.status];
          return (
            <tr key={row.draftId}>
              <td>{row.draftId}</td>
              <td>
                <Badge bg="light" className="text-dark border">
                  {DRAFT_TYPE_LABEL[row.type]}
                </Badge>
              </td>
              <td className="fw-semibold">{row.title}</td>
              <td>{row.drafterName}</td>
              <td>
                <Badge bg={`${meta.variant}-subtle`} className={`text-${meta.variant}`}>
                  {meta.label}
                </Badge>
              </td>
              <td>{row.createdAt}</td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={6} className="text-center py-4 text-muted">
            문서가 없습니다.
          </td>
        </tr>
      )}
    </tbody>
  </Table>
);

const TABS = {
  submitted: { label: '상신함', rows: submittedDrafts },
  unsubmitted: { label: '임시저장함', rows: unsubmittedDrafts },
};

const DocumentBox = () => {
  const [tab, setTab] = useState('submitted');

  return (
    <Container fluid>
      <PageBreadcrumb title="문서함" subtitle="전자결재" />

      <Row className="row-cols-xxl-4 row-cols-2 g-2 mb-3">
        <Col>
          <SummaryCard label="상신 문서" value={documentBoxSummary.submitted} variant="primary" />
        </Col>
        <Col>
          <SummaryCard label="임시저장" value={documentBoxSummary.unsubmitted} variant="secondary" />
        </Col>
        <Col>
          <SummaryCard label="결재 대기" value={documentBoxSummary.pendingApproval} variant="warning" />
        </Col>
        <Col>
          <SummaryCard label="조회 가능" value={documentBoxSummary.accessible} variant="info" />
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <Nav variant="tabs" className="card-header-tabs" activeKey={tab} onSelect={setTab}>
            {Object.entries(TABS).map(([key, { label }]) => (
              <Nav.Item key={key}>
                <Nav.Link eventKey={key}>{label}</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Card.Header>
        <Card.Body className="p-0">
          <DraftTable rows={TABS[tab].rows} />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DocumentBox;
