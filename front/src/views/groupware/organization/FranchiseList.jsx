import {useMemo, useState} from 'react';
import {Badge, Button, Card, Container, Form, InputGroup, Table} from 'react-bootstrap';
import {TbBuildingStore, TbSearch} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {FRANCHISE_STATUS_META, franchises} from './data';

/**
 * 가맹점 목록 (FRANCHISE_LIST)
 */
const formatKRW = (value) => value.toLocaleString('ko-KR') + '원';

const FranchiseList = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(
    () =>
      franchises.filter((f) => {
        const matchKeyword = !keyword || f.name.includes(keyword) || f.region.includes(keyword);
        const matchStatus = !status || f.status === status;
        return matchKeyword && matchStatus;
      }),
    [keyword, status]
  );

  return (
    <Container fluid>
      <PageBreadcrumb title="가맹점 관리" subtitle="가맹점" />

      <Card>
        <Card.Header className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div className="d-flex flex-wrap gap-2">
            <InputGroup style={{ width: 240 }}>
              <InputGroup.Text>
                <TbSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="가맹점명·지역 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </InputGroup>
            <Form.Select style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">전체 상태</option>
              {Object.entries(FRANCHISE_STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Form.Select>
          </div>
          <Button variant="primary">
            <TbBuildingStore className="me-1" /> 가맹점 등록
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>가맹점명</th>
                <th>지역</th>
                <th>담당자</th>
                <th className="text-end">월 매출</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((f) => {
                  const meta = FRANCHISE_STATUS_META[f.status];
                  return (
                    <tr key={f.franchiseId}>
                      <td className="fw-semibold">{f.name}</td>
                      <td>{f.region}</td>
                      <td>{f.managerName}</td>
                      <td className="text-end">{formatKRW(f.monthlySales)}</td>
                      <td>
                        <Badge bg={`${meta.variant}-subtle`} className={`text-${meta.variant}`}>
                          {meta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    조건에 맞는 가맹점이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FranchiseList;
