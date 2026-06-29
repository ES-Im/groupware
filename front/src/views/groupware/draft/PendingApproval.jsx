import {Badge, Button, Card, Container, Table} from 'react-bootstrap';
import {TbCheck, TbX} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {APPROVAL_STATUS_META, DRAFT_TYPE_LABEL, pendingApprovalDrafts} from './data';

/**
 * 결재 대기 (MY_PENDING_APPROVAL_DRAFTS)
 * 승인/반려는 draftApi.approveDraft / rejectDraft 에 연결 예정.
 */
const PendingApproval = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="결재 대기" subtitle="전자결재" />

      <Card>
        <Card.Header>
          <h5 className="mb-0">
            내가 결재할 문서{' '}
            <Badge bg="warning-subtle" className="text-warning ms-1">
              {pendingApprovalDrafts.length}
            </Badge>
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>번호</th>
                <th>종류</th>
                <th>제목</th>
                <th>기안자</th>
                <th>상태</th>
                <th>작성일</th>
                <th className="text-end">결재</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovalDrafts.map((row) => {
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
                    <td className="text-end">
                      <Button variant="success" size="sm" className="me-1">
                        <TbCheck />
                      </Button>
                      <Button variant="outline-danger" size="sm">
                        <TbX />
                      </Button>
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

export default PendingApproval;
