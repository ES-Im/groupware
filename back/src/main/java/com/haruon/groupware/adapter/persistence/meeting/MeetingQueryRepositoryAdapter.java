package com.haruon.groupware.adapter.persistence.meeting;

import com.haruon.groupware.application.meeting.required.MeetingQueryRepository;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationResponse;
import com.haruon.groupware.domain.employee.QDept;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.employee.QEmpBelongings;
import com.haruon.groupware.domain.meeting.QMeeting;
import com.haruon.groupware.domain.meeting.QMeetingParticipant;
import com.haruon.groupware.domain.meeting.QMeetingRoom;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static com.haruon.groupware.adapter.persistence.util.DateParseSupport.getFirstDateOnNextMonth;
import static com.haruon.groupware.adapter.persistence.util.DateParseSupport.getStartDateByYearMonth;

@Repository
@RequiredArgsConstructor
public class MeetingQueryRepositoryAdapter implements MeetingQueryRepository {

    private final JPAQueryFactory query;
    private final QMeeting meeting = QMeeting.meeting;
    private final QMeetingRoom meetingRoom = QMeetingRoom.meetingRoom;
    private final QMeetingParticipant participant = QMeetingParticipant.meetingParticipant;
    private final QEmp emp = QEmp.emp;
    private final QDept dept = QDept.dept;
    private final QEmpBelongings belongings = QEmpBelongings.empBelongings;

    @Override
    public List<ReservationResponse> findMeetingsByEmpId(Long empId, LocalDateTime start, LocalDateTime end) {
        LocalDate startDate = start.toLocalDate();
        LocalDate endDate = end.toLocalDate();

        return query
                .select(Projections.constructor(
                        ReservationResponse.class,
                        meeting.id, meetingRoom.id, meetingRoom.name,
                        emp.id, dept.deptName, emp.empName,
                        meeting.title, meeting.meetingDate, meeting.startAt, meeting.endAt, meeting.isCancel,
                        meeting.meetingParticipants.size()
                )).from(meeting)
                .join(meeting.meetingRoom, meetingRoom)
                .join(meeting.emp, emp)
                .join(emp.empBelongings, belongings).on(belongings.endAt.isNull(), belongings.isPrimary)
                .join(belongings.dept, dept)
                .where(
                        JPAExpressions.selectOne()
                                .from(participant)
                                .where(
                                        (participant.meeting.eq(meeting).and(participant.emp.id.eq(empId))
                                        ).or(meeting.emp.id.eq(empId))
                                )
                                .exists(),
                        meeting.meetingDate.goe(startDate),
                        meeting.meetingDate.lt(endDate)
                )
                .orderBy(meeting.meetingDate.asc(), meeting.id.asc())
                .fetch();
    }

    @Override
    public ReservationDetailResponse findMeetingById(Long meetingId) {
        ReservationDetailResponse.ReservationInfo reservationInfo = query
                .select(Projections.constructor(
                                ReservationDetailResponse.ReservationInfo.class,
                                meeting.id, meetingRoom.id, meetingRoom.name,
                                emp.id, dept.deptName, emp.empName,
                                meeting.title, meeting.meetingParticipants.size(),
                                meeting.meetingDate, meeting.startAt, meeting.endAt, meeting.isCancel
                        )
                ).from(meeting)
                .join(meeting.meetingRoom, meetingRoom)
                .join(meeting.emp, emp)
                .join(emp.empBelongings, belongings).on(belongings.endAt.isNull(), belongings.isPrimary.isTrue())
                .join(belongings.dept, dept)
                .where(
                        meeting.id.eq(meetingId)
                ).fetchOne();

        if (reservationInfo == null) return null;

        List<ReservationDetailResponse.ParticipantResponse> participants = query
                .select(Projections.constructor(
                        ReservationDetailResponse.ParticipantResponse.class,
                        emp.id,
                        dept.deptName,
                        emp.empName
                ))
                .from(participant)
                .join(participant.emp, emp)
                .join(emp.empBelongings, belongings)
                .on(belongings.endAt.isNull(), belongings.isPrimary.isTrue())
                .join(belongings.dept, dept)
                .where(participant.meeting.id.eq(meetingId))
                .orderBy(emp.empName.asc(), emp.id.asc())
                .fetch();

        return ReservationDetailResponse.of(reservationInfo, participants);
    }

    @Override
    public Page<ReservationResponse> findMeetings(
            YearMonth targetMonth,
            @Nullable String keyword,
            @Nullable Long meetingRoomId,
            Pageable pageable
    ) {
        LocalDate startDate = getStartDateByYearMonth(targetMonth);
        LocalDate endDate = getFirstDateOnNextMonth(targetMonth);

        Long rows = query
                .select(meeting.countDistinct())
                .from(meeting)
                .join(meeting.meetingRoom, meetingRoom)
                .join(meeting.emp, emp)
                .join(emp.empBelongings, belongings).on(belongings.endAt.isNull(), belongings.isPrimary.isTrue())
                .join(belongings.dept, dept)
                .where(
                        isKeywordContains(keyword),
                        isMeetingRoomIdEq(meetingRoomId),
                        meeting.meetingDate.goe(startDate),
                        meeting.meetingDate.lt(endDate)
                ).fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<ReservationResponse> responses = query
                .select(Projections.constructor(
                        ReservationResponse.class,
                        meeting.id, meeting.meetingRoom.id, meetingRoom.name,
                        emp.id, dept.deptName, emp.empName,
                        meeting.title, meeting.meetingDate, meeting.startAt, meeting.endAt, meeting.isCancel,
                        meeting.meetingParticipants.size()
                )).from(meeting)
                .join(meeting.meetingRoom, meetingRoom)
                .join(meeting.emp, emp)
                .join(emp.empBelongings, belongings).on(belongings.endAt.isNull(), belongings.isPrimary.isTrue())
                .join(belongings.dept, dept)
                .where(
                        isKeywordContains(keyword),
                        isMeetingRoomIdEq(meetingRoomId),
                        meeting.meetingDate.goe(startDate),
                        meeting.meetingDate.lt(endDate)
                )
                .orderBy(
                        meeting.meetingDate.desc(), meeting.meetingRoom.id.asc(), meeting.id.asc()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    private BooleanExpression isKeywordContains(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : meeting.title.containsIgnoreCase(keyword)
                  .or(emp.empName.containsIgnoreCase(keyword))
                  .or(meetingRoom.name.containsIgnoreCase(keyword));
    }

    private BooleanExpression isMeetingRoomIdEq(@Nullable Long meetingRoomId) {
        return meetingRoomId == null
                ? null
                : meeting.meetingRoom.id.eq(meetingRoomId);
    }
}
