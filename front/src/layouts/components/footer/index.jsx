import {appName, author, currentYear} from '@/helpers';
import {Col, Container, Row} from 'react-bootstrap';

const Footer = () => {
  return <footer className="footer">
      <Container fluid>
        <Row>
          <Col xs={12} className="text-center">
            ©  {currentYear} {appName} - <span className="fw-semibold">{author}</span>
          </Col>
        </Row>
      </Container>
    </footer>;
};
export default Footer;