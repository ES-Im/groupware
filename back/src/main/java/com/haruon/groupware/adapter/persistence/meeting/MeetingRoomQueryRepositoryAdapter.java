package com.haruon.groupware.adapter.persistence.meeting;

import com.haruon.groupware.application.file.service.query.dto.FileListInfo;
import com.haruon.groupware.application.meeting.required.MeetingRoomQueryRepository;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomDetailResponse;
import com.haruon.groupware.application.meeting.service.query.dto.MeetingRoomResponse;
import com.haruon.groupware.application.meeting.service.query.dto.ReservationsByRoomResponse;
import com.haruon.groupware.domain.employee.QDept;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.employee.QEmpBelongings;
import com.haruon.groupware.domain.meeting.QMeeting;
import com.haruon.groupware.domain.meeting.QMeetingRoom;
import com.haruon.groupware.domain.meeting.QMeetingRoomFile;
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
import java.time.LocalTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class MeetingRoomQueryRepositoryAdapter implements MeetingRoomQueryRepository {


    private final JPAQueryFactory query;
    private final QMeeting meeting = QMeeting.meeting;
    private final QMeetingRoom meetingRoom = QMeetingRoom.meetingRoom;
    private final QMeetingRoomFile meetingRoomFile = QMeetingRoomFile.meetingRoomFile;
    private final QEmp emp = QEmp.emp;
    private final QDept dept = QDept.dept;
    private final QEmpBelongings belongings = QEmpBelongings.empBelongings;


    /** 해당 회의실이 조회한 날짜, 시각에 예약이 없으며, 조회한 수용인원보다 높아야한다
     * select ~dto 필드들
     *   from meetingRoom o
     *  where
     *      o.capacity goe :capacity and
     *      o.isAvailable.isTrue
     *      not exist (
     *           selectOne
     *            from Meeting meeting
     *           where meeting.meetingRoom eq room
     *             and meeting.meetingDate eq :date
     *             and meeting.isCancel eq false
     *             and meeting.startAt lt :endAt
     *             and meeting.endAt gt :startAt
     *      )
     */
    @Override
    public Page<MeetingRoomResponse> findAvailableMeetingRooms(
            @Nullable LocalDate date,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt,
            @Nullable Integer capacity,
            Pageable pageable
    ) {
        Long rows = query
                .select(meetingRoom.id.countDistinct())
                .from(meetingRoom)
                .where(findAvailableWhereExpressions(date, startAt, endAt, capacity))
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<MeetingRoomResponse> responses = query
                .select(Projections.constructor(
                        MeetingRoomResponse.class,
                        meetingRoom.id, meetingRoom.name, meetingRoom.capacity, meetingRoom.isAvailable
                )).from(meetingRoom)
                .where(findAvailableWhereExpressions(date, startAt, endAt, capacity))
                .orderBy(meetingRoom.id.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    private BooleanExpression[] findAvailableWhereExpressions(
            @Nullable LocalDate date, @Nullable LocalTime startAt, @Nullable LocalTime endAt, @Nullable Integer capacity
    ) {
        return new BooleanExpression[]{
                capacityGoe(capacity),
                meetingRoom.isAvailable.isTrue(),
                isNotReservedAt(date, startAt, endAt)
        };
    }

    private BooleanExpression capacityGoe(@Nullable Integer capacity) {
        return capacity == null
                ? null
                : meetingRoom.capacity.goe(capacity);
    }

    private BooleanExpression isNotReservedAt(
            @Nullable LocalDate date, @Nullable LocalTime startAt, @Nullable LocalTime endAt
    ) {
        if(date == null && startAt == null && endAt == null) return null;

        return JPAExpressions
                .selectOne()
                .from(meeting)
                .where(
                        meeting.meetingRoom.eq(meetingRoom),
                        meeting.meetingDate.eq(date),
                        meeting.isCancel.isFalse(),
                        meeting.startAt.lt(endAt),
                        meeting.endAt.gt(startAt)
                )
                .notExists();
    }


    @Override
    public Page<MeetingRoomResponse> findMeetingRooms(
            @Nullable Boolean available,
            @Nullable Boolean bookedInFuture,
            @Nullable LocalDateTime now,
            Pageable pageable
    ) {
        Long rows = query
                .select(meetingRoom.id.countDistinct())
                .from(meetingRoom)
                .where(isAvailable(available), isBookedInFuture(bookedInFuture, now))
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;

        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<MeetingRoomResponse> responses = query
                .select(Projections.constructor(
                        MeetingRoomResponse.class,
                        meetingRoom.id, meetingRoom.name, meetingRoom.capacity, meetingRoom.isAvailable
                )).from(meetingRoom)
                .where(isAvailable(available), isBookedInFuture(bookedInFuture, now))
                .orderBy(meetingRoom.isAvailable.asc(), meetingRoom.id.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    private BooleanExpression isAvailable(@Nullable Boolean available) {
        return available == null
                ? null : meetingRoom.isAvailable.eq(available);
    }

    private BooleanExpression isBookedInFuture(@Nullable Boolean isBookedInFuture, @Nullable LocalDateTime now) {
        if(isBookedInFuture == null || now == null) return null;

        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();

        BooleanExpression futureMeetingExists = JPAExpressions.selectOne()
                        .from(meeting)
                        .where(
                                meeting.meetingRoom.eq(meetingRoom),
                                meeting.isCancel.isFalse(),
                                meeting.meetingDate.gt(today)
                                .or(
                                        meeting.meetingDate.eq(today)
                                        .and(meeting.endAt.gt(currentTime))
                                )
                        )
                        .exists();

        return isBookedInFuture ? futureMeetingExists : futureMeetingExists.not();
    }

    @Override
    public List<ReservationsByRoomResponse> findMeetingsByMeetingRoomId(
            Long meetingRoomId, LocalDateTime start, LocalDateTime end
    ) {
        LocalDate startDate = start.toLocalDate();
        LocalDate endDate = end.toLocalDate();

        return query
                .select(Projections.constructor(
                        ReservationsByRoomResponse.class,
                        dept.deptName, emp.empName, meeting.meetingParticipants.size(),
                        meeting.meetingDate, meeting.startAt, meeting.endAt
                )).from(meeting)
                .join(meeting.emp, emp)
                .join(emp.empBelongings, belongings)
                .join(belongings.dept, dept)
                .where(
                        meeting.meetingRoom.id.eq(meetingRoomId),
                        meeting.isCancel.isFalse(),
                        meeting.meetingDate.goe(startDate),
                        meeting.meetingDate.lt(endDate)
                ).orderBy(meeting.meetingDate.asc(), meeting.id.asc())
                .fetch();
    }

    @Override
    public MeetingRoomDetailResponse findMeetingRoomById(Long meetingRoomId) {
        return query
                .select(Projections.constructor(
                        MeetingRoomDetailResponse.class,
                        meetingRoom.id, meetingRoom.name, meetingRoom.description, meetingRoom.capacity, meetingRoom.isAvailable
                ))
                .from(meetingRoom)
                .where(meetingRoom.id.eq(meetingRoomId))
                .fetchOne();
    }

    @Override
    public List<FileListInfo> findMeetingRoomFilesById(Long meetingRoomId) {
        return query
                .select(Projections.constructor(
                        FileListInfo.class,
                        meetingRoomFile.id, meetingRoomFile.originalName, meetingRoomFile.extension, meetingRoomFile.fileSize
                )).from(meetingRoomFile)
                .where(meetingRoomFile.meetingRoom.id.eq(meetingRoomId))
                .fetch();
    }
}
