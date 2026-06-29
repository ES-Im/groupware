import {Badge, Button, Card, Container, Form, Table} from 'react-bootstrap';
import {TbPlus} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {categories} from './data';

/**
 * 카테고리 관리 (CATEGORY_MANAGEMENT) — ADMIN
 */
const CategoryManagement = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="카테고리 관리" subtitle="게시판" />

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">카테고리</h5>
          <Button variant="primary" size="sm">
            <TbPlus className="me-1" /> 카테고리 등록
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>번호</th>
                <th>카테고리명</th>
                <th>노출 여부</th>
                <th className="text-end">관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.categoryId}>
                  <td>{c.categoryId}</td>
                  <td className="fw-semibold">{c.name}</td>
                  <td>
                    {c.visible ? (
                      <Badge bg="success-subtle" className="text-success">
                        노출
                      </Badge>
                    ) : (
                      <Badge bg="secondary-subtle" className="text-secondary">
                        숨김
                      </Badge>
                    )}
                  </td>
                  <td className="text-end">
                    <Form.Check type="switch" defaultChecked={c.visible} className="d-inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CategoryManagement;
