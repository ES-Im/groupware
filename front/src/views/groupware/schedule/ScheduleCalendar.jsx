import {Button, Card, Container} from 'react-bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import {TbPlus} from 'react-icons/tb';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {scheduleEvents} from './data';

/**
 * 일정 캘린더 (SCHEDULE_CALENDAR)
 * 실제 연동 시 scheduleApi.getScheduleCalendar 로 이벤트를 조회한다.
 */
const ScheduleCalendar = () => {
  return (
    <Container fluid>
      <PageBreadcrumb title="일정" subtitle="일정/회의" />

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">내 일정</h5>
          <Button variant="primary" size="sm">
            <TbPlus className="me-1" /> 일정 등록
          </Button>
        </Card.Header>
        <Card.Body>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate="2026-06-29"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
            }}
            events={scheduleEvents}
            height="auto"
            locale="ko"
            buttonText={{
              today: '오늘',
              month: '월',
              week: '주',
              day: '일',
              list: '목록',
            }}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ScheduleCalendar;
