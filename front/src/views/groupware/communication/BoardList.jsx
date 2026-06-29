import {useMemo, useState} from 'react';
import {Badge, Button, Card, Container, Form, Table} from 'react-bootstrap';
import {TbEye, TbMessageCircle, TbPencilPlus, TbThumbUp} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {boards, categories} from './data';

/**
 * 게시판 목록 (BOARD_LIST + CATEGORY_LIST)
 */
const BoardList = () => {
  const [category, setCategory] = useState('');

  const filtered = useMemo(
    () => boards.filter((b) => !category || b.categoryName === category),
    [category]
  );

  return (
    <Container fluid>
      <PageBreadcrumb title="게시판" subtitle="게시판" />

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Form.Select style={{ width: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">전체 카테고리</option>
            {categories
              .filter((c) => c.visible)
              .map((c) => (
                <option key={c.categoryId} value={c.name}>
                  {c.name}
                </option>
              ))}
          </Form.Select>
          <Button variant="primary" size="sm">
            <TbPencilPlus className="me-1" /> 글쓰기
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="table-custom table-centered mb-0">
            <thead className="bg-light bg-opacity-25 thead-sm text-uppercase fs-xxs">
              <tr>
                <th>카테고리</th>
                <th>제목</th>
                <th>작성자</th>
                <th className="text-center">조회</th>
                <th className="text-center">좋아요</th>
                <th className="text-center">댓글</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.boardId}>
                  <td>
                    <Badge bg="light" className="text-dark border">
                      {b.categoryName}
                    </Badge>
                  </td>
                  <td className="fw-semibold">{b.title}</td>
                  <td>{b.writerName}</td>
                  <td className="text-center text-muted">
                    <TbEye className="me-1" />
                    {b.viewCount}
                  </td>
                  <td className="text-center text-muted">
                    <TbThumbUp className="me-1" />
                    {b.likeCount}
                  </td>
                  <td className="text-center text-muted">
                    <TbMessageCircle className="me-1" />
                    {b.commentCount}
                  </td>
                  <td>{b.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BoardList;
