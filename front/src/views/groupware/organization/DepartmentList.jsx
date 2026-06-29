import {Badge, Button, Card, Container, Table} from 'react-bootstrap';
import {TbBuildingPlus, TbUsers} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {departments} from './data';

/**
 * 부서 목록 (DEPTS / DEPT_MEMBERS)
 */
const DepartmentList = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="부서" subtitle="조직" />

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">부서 현황</h5>
          <Button variant="primary" size="sm">
            <TbBuildingPlus className="me-1" /> 부서 등록
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>번호</th>
                <th>부서명</th>
                <th>부서장</th>
                <th>인원</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.deptId}>
                  <td>{d.deptId}</td>
                  <td className="fw-semibold">{d.name}</td>
                  <td>{d.leaderName}</td>
                  <td>
                    <TbUsers className="me-1 text-muted" />
                    {d.memberCount}명
                  </td>
                  <td>
                    {d.active ? (
                      <Badge bg="success-subtle" className="text-success">
                        활성
                      </Badge>
                    ) : (
                      <Badge bg="secondary-subtle" className="text-secondary">
                        비활성
                      </Badge>
                    )}
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

export default DepartmentList;
