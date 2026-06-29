import {Card, Container} from 'react-bootstrap';
import {TbTool} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';

/**
 * HARUON 도메인 화면 준비 전까지 사용하는 공용 placeholder.
 * 실제 화면 구현 시 이 컴포넌트 대신 도메인별 페이지로 교체한다.
 */
const PlaceholderPage = ({ title, subtitle, description }) => {
  return (
    <Container fluid>
      <PageBreadcrumb title={title} subtitle={subtitle} />
      <Card className="text-center">
        <Card.Body className="py-5">
          <TbTool className="fs-1 text-muted mb-3" />
          <h4 className="mb-2">{title} 화면 준비 중</h4>
          <p className="text-muted mb-0">
            {description ?? '이 도메인 화면은 아직 구현 전입니다. services 레이어와 연동하여 구성할 예정입니다.'}
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PlaceholderPage;
