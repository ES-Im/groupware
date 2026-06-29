import {Badge, Card, Container, Table} from 'react-bootstrap';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {inquiries} from './data';

/**
 * 가맹점 문의 목록 (FRANCHISE_INQUIRY_LIST)
 */
const InquiryList = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="문의" subtitle="가맹점" />

      <Card>
        <Card.Header>
          <h5 className="mb-0">가맹점 문의</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>번호</th>
                <th>가맹점</th>
                <th>제목</th>
                <th>담당자</th>
                <th>답변 상태</th>
                <th>접수일</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((q) => (
                <tr key={q.inquiryId}>
                  <td>{q.inquiryId}</td>
                  <td>{q.franchiseName}</td>
                  <td className="fw-semibold">{q.title}</td>
                  <td>{q.assignedName}</td>
                  <td>
                    {q.answered ? (
                      <Badge bg="success-subtle" className="text-success">
                        답변완료
                      </Badge>
                    ) : (
                      <Badge bg="warning-subtle" className="text-warning">
                        미답변
                      </Badge>
                    )}
                  </td>
                  <td>{q.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InquiryList;
